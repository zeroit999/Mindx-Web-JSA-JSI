import os
import shutil
import argparse
import sys

# Kiểm tra phiên bản Python
if sys.version_info < (3, 8):
    print("Cần Python 3.8 trở lên để chạy ứng dụng này!")
    sys.exit(1)

def setup_directories():
    """Tạo cấu trúc thư mục cần thiết"""
    # Tạo thư mục cho dữ liệu thô
    if not os.path.exists('raw_docs'):
        os.makedirs('raw_docs')
        print("✓ Đã tạo thư mục raw_docs")
    
    # Tạo thư mục static nếu chưa có
    for dir_path in ['static/css', 'static/js', 'templates']:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"✓ Đã tạo thư mục {dir_path}")

def create_default_config():
    """Tạo file cấu hình mặc định nếu chưa có"""
    if not os.path.exists('config.py'):
        with open('config.py', 'w', encoding='utf-8') as f:
            f.write('# Cấu hình API keys và các thông số khác\n\n')
            f.write('# API key cho Google Gemini API\n')
            f.write('# Thay thế bằng API key của bạn\n')
            f.write('GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"\n\n')
            f.write('# Cấu hình chung\n')
            f.write('CHUNK_SIZE = 1000\n')
            f.write('CHUNK_OVERLAP = 200\n')
            f.write('TOP_K_RESULTS = 5\n')
            f.write('TOP_N_RERANK = 3\n')
        print("✓ Đã tạo file config.py mặc định")

def setup_sample_data(args):
    """Sao chép dữ liệu mẫu vào thư mục raw_docs"""
    if args.sample_data:
        sample_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sample_data')
        if os.path.exists(sample_data_dir):
            for file in os.listdir(sample_data_dir):
                src = os.path.join(sample_data_dir, file)
                dst = os.path.join('raw_docs', file)
                if os.path.isfile(src):
                    shutil.copy2(src, dst)
            print("✓ Đã sao chép dữ liệu mẫu vào thư mục raw_docs")
        else:
            print("⚠️ Không tìm thấy thư mục dữ liệu mẫu")

def check_dependencies():
    """Kiểm tra các thư viện phụ thuộc"""
    try:
        import flask
        import numpy
        import faiss
        import sentence_transformers
        import google.generativeai
        import PyPDF2
        import docx
        print("✓ Tất cả các thư viện phụ thuộc đã được cài đặt")
        return True
    except ImportError as e:
        print(f"⚠️ Thư viện chưa được cài đặt: {e.name}")
        print("Vui lòng cài đặt các thư viện bị thiếu bằng lệnh:")
        print("pip install -r requirements.txt")
        return False

def update_api_key(args):
    """Cập nhật API key trong file config.py"""
    if args.api_key:
        with open('config.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Thay thế API key
        content = content.replace('GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"', f'GEMINI_API_KEY = "{args.api_key}"')
        
        with open('config.py', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✓ Đã cập nhật API key trong file config.py")

def main():
    parser = argparse.ArgumentParser(description='Thiết lập Chatbot Tư Vấn Hướng Nghiệp')
    parser.add_argument('--sample-data', action='store_true', help='Sao chép dữ liệu mẫu vào thư mục raw_docs')
    parser.add_argument('--api-key', type=str, help='API key cho Google Gemini')
    
    args = parser.parse_args()
    
    print("\n=== THIẾT LẬP CHATBOT TƯ VẤN HƯỚNG NGHIỆP ===\n")
    
    setup_directories()
    create_default_config()
    update_api_key(args)
    setup_sample_data(args)
    
    if check_dependencies():
        print("\n✓ Thiết lập hoàn tất! Bạn có thể chạy ứng dụng bằng lệnh:")
        print("python app.py")
        print("\nTruy cập ứng dụng tại: http://127.0.0.1:5000")
    else:
        print("\n⚠️ Vui lòng cài đặt các thư viện còn thiếu trước khi chạy ứng dụng.")

if __name__ == "__main__":
    main()