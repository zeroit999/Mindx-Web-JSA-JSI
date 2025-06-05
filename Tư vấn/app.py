from flask import Flask, request, jsonify, render_template
import os
import pickle
import faiss
import numpy as np
import google.generativeai as genai
from PyPDF2 import PdfReader
import docx
import re
from sentence_transformers import SentenceTransformer
import config

app = Flask(__name__)

# Cấu hình Gemini API
genai.configure(api_key=config.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Tải mô hình sentence transformer
embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# Thư mục chứa tài liệu
RAW_DOCS_DIR = 'raw_docs'

# Khởi tạo vector database và chunks
vector_db = None
chunks = []
chunk_embeddings = None

def preprocess_text(text):
    """Làm sạch và chuẩn hóa văn bản"""
    # Loại bỏ ký tự đặc biệt và khoảng trắng dư thừa
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,?!;:()\-\'\"]+', '', text)
    return text.strip()

def extract_text_from_pdf(pdf_path):
    """Trích xuất văn bản từ file PDF"""
    text = ""
    reader = PdfReader(pdf_path)
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return preprocess_text(text)

def extract_text_from_docx(docx_path):
    """Trích xuất văn bản từ file DOCX"""
    doc = docx.Document(docx_path)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return preprocess_text(text)

def extract_text_from_file(file_path):
    """Trích xuất văn bản từ file dựa vào định dạng"""
    if file_path.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif file_path.lower().endswith('.docx'):
        return extract_text_from_docx(file_path)
    else:
        return ""

def text_to_chunks(text, chunk_size=1000, overlap=200):
    """Chia văn bản thành các đoạn nhỏ với độ chồng lấn"""
    if not text:
        return []
    
    words = text.split()
    chunks_list = []
    
    i = 0
    while i < len(words):
        chunk = ' '.join(words[i:i+chunk_size])
        chunks_list.append(chunk)
        i += chunk_size - overlap
        
    return chunks_list

def create_embeddings(chunks_list):
    """Tạo embedding vector cho các chunks"""
    return embedding_model.encode(chunks_list)

def build_faiss_index(embeddings):
    """Xây dựng FAISS index từ embeddings"""
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings).astype('float32'))
    return index

def process_all_documents():
    """Xử lý tất cả tài liệu trong thư mục"""
    global chunks, chunk_embeddings, vector_db
    
    all_chunks = []
    
    # Kiểm tra xem thư mục có tồn tại không
    if not os.path.exists(RAW_DOCS_DIR):
        os.makedirs(RAW_DOCS_DIR)
    
    # Trích xuất văn bản từ tất cả file
    for filename in os.listdir(RAW_DOCS_DIR):
        file_path = os.path.join(RAW_DOCS_DIR, filename)
        if os.path.isfile(file_path):
            text = extract_text_from_file(file_path)
            file_chunks = text_to_chunks(text)
            all_chunks.extend(file_chunks)
    
    chunks = all_chunks
    
    # Nếu có chunks
    if chunks:
        # Tạo embeddings và lưu vào FAISS index
        chunk_embeddings = create_embeddings(chunks)
        vector_db = build_faiss_index(chunk_embeddings)
        
        # Lưu dữ liệu để sử dụng sau này
        with open('vector_db.pickle', 'wb') as f:
            pickle.dump(vector_db, f)
        with open('chunks.pickle', 'wb') as f:
            pickle.dump(chunks, f)
        with open('chunk_embeddings.pickle', 'wb') as f:
            pickle.dump(chunk_embeddings, f)
        
        return True
    return False

def load_database():
    """Tải FAISS database từ disk nếu tồn tại"""
    global chunks, chunk_embeddings, vector_db
    
    if os.path.exists('vector_db.pickle') and os.path.exists('chunks.pickle') and os.path.exists('chunk_embeddings.pickle'):
        with open('vector_db.pickle', 'rb') as f:
            vector_db = pickle.load(f)
        with open('chunks.pickle', 'rb') as f:
            chunks = pickle.load(f)
        with open('chunk_embeddings.pickle', 'rb') as f:
            chunk_embeddings = pickle.load(f)
        return True
    return False

def search_similar_chunks(question, top_k=5):
    """Tìm các đoạn văn bản tương tự với câu hỏi"""
    question_embedding = embedding_model.encode([question])
    _, indices = vector_db.search(np.array(question_embedding).astype('float32'), top_k)
    return [chunks[idx] for idx in indices[0]]

def rerank_results(question, contexts, top_n=3):
    """Re-rank kết quả tìm kiếm dựa trên độ tương tự với câu hỏi"""
    # Đơn giản hóa: sử dụng tính tương tự cosine để re-rank
    question_embedding = embedding_model.encode([question])[0]
    
    reranked = []
    for i, context in enumerate(contexts):
        context_embedding = embedding_model.encode([context])[0]
        similarity = np.dot(question_embedding, context_embedding) / (
            np.linalg.norm(question_embedding) * np.linalg.norm(context_embedding)
        )
        reranked.append((similarity, context))
    
    # Sắp xếp theo độ tương tự giảm dần và lấy top_n
    reranked.sort(reverse=True)
    return [context for _, context in reranked[:top_n]]

def generate_answer(question, contexts):
    """Sinh câu trả lời sử dụng Gemini API dựa trên ngữ cảnh"""
    if not contexts:
        return "Tôi không tìm thấy thông tin liên quan trong cơ sở dữ liệu. Vui lòng thử câu hỏi khác hoặc thêm tài liệu hướng nghiệp vào hệ thống."
    
    # Tạo prompt với ngữ cảnh
    prompt = f"""
    Dưới đây là một số thông tin liên quan đến hướng nghiệp:
    
    {' '.join(contexts)}
    
    Dựa trên thông tin trên, hãy trả lời câu hỏi sau một cách chính xác, đầy đủ và hữu ích:
    {question}
    
    Trả lời cần thân thiện, chuyên nghiệp và tập trung vào việc tư vấn hướng nghiệp.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Có lỗi xảy ra khi tạo câu trả lời: {str(e)}"

@app.route('/')
def index():
    """Hiển thị trang chủ"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """API nhận tệp tin để xử lý"""
    if 'file' not in request.files:
        return jsonify({"error": "Không có tệp nào được tải lên"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "Không có tệp nào được chọn"}), 400
    
    # Lưu tệp và xử lý
    if not os.path.exists(RAW_DOCS_DIR):
        os.makedirs(RAW_DOCS_DIR)
    
    file_path = os.path.join(RAW_DOCS_DIR, file.filename)
    file.save(file_path)
    
    # Xử lý lại tất cả tài liệu
    success = process_all_documents()
    
    if success:
        return jsonify({"message": "Tệp đã được tải lên và xử lý thành công"}), 200
    else:
        return jsonify({"error": "Có lỗi xảy ra khi xử lý tệp"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """API xử lý câu hỏi và trả lời"""
    data = request.json
    question = data.get('question', '')
    
    if not question:
        return jsonify({"error": "Câu hỏi không được để trống"}), 400
    
    # Kiểm tra xem database đã được tải chưa
    if vector_db is None:
        if not load_database():
            return jsonify({"error": "Chưa có dữ liệu hướng nghiệp. Vui lòng tải lên tài liệu trước."}), 400
    
    # Tìm kiếm các đoạn tương tự
    similar_chunks = search_similar_chunks(question)
    
    # Re-rank kết quả
    reranked_chunks = rerank_results(question, similar_chunks)
    
    # Sinh câu trả lời
    answer = generate_answer(question, reranked_chunks)
    
    return jsonify({"answer": answer}), 200

@app.route('/init', methods=['GET'])
def init_db():
    """API khởi tạo database từ các tệp hiện có"""
    if load_database():
        return jsonify({"message": "Database đã được tải"}), 200
    
    success = process_all_documents()
    
    if success:
        return jsonify({"message": "Database đã được khởi tạo"}), 200
    else:
        return jsonify({"error": "Không thể khởi tạo database. Vui lòng tải tài liệu trước."}), 400

if __name__ == '__main__':
    # Tự động khởi tạo database nếu có thể
    load_database()
    app.run(debug=True)