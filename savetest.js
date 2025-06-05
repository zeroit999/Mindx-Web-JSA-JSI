import { db, doc, setDoc } from "./auth.js";

// Hàm lưu kết quả bài kiểm tra vào Firestore
export async function saveTestResult(userId, testType, result) {
  try {
    // Kiểm tra xem userId có hợp lệ không
    if (!userId) {
      throw new Error("Cần ID người dùng để lưu kết quả bài kiểm tra.");
    }

    // Tạo ID duy nhất cho bài kiểm tra (ví dụ: MBTI_2025-05-16-2158)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const testId = `${testType}_${timestamp}`;

    // Tham chiếu đến tài liệu kết quả bài kiểm tra
    const resultRef = doc(db, "testResults", userId, "results", testId);

    // Lưu kết quả vào Firestore
    await setDoc(resultRef, {
      testType: testType,
      result: result,
      timestamp: new Date().toISOString()
    });

    console.log(`Đã lưu kết quả bài kiểm tra ${testType} cho người dùng ${userId}`);
  } catch (error) {
    console.error("Lỗi khi lưu kết quả bài kiểm tra:", error);
    throw error;
  }
}