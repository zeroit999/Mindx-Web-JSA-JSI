let traitScores = {
    e: 0, i: 0,
    s: 0, n: 0,
    t: 0, f: 0,
    j: 0, p: 0
};

let selectedAnswers = {}; // Lưu câu đã chọn để xử lý lại nếu đổi

const maxPointsPerTrait = {
    e: 115, i: 115, // 23 câu
    s: 70, n: 65,   // 14/13 câu
    t: 90, f: 95,   // 18/19 câu
    j: 115, p: 105  // 23/21 câu
};

// Gắn sự kiện khi chọn đáp án
document.querySelectorAll('.btn-answer').forEach(button => {
    button.addEventListener('click', function () {
        const question = this.getAttribute('data-answer');

        // Gỡ class selected trong cùng câu hỏi
        const groupButtons = document.querySelectorAll(`.btn-answer[data-answer="${question}"]`);
        groupButtons.forEach(btn => btn.classList.remove('selected'));

        // Gán lại class selected
        this.classList.add('selected');

        // Nếu câu này đã chọn trước đó, trừ điểm cũ
        if (selectedAnswers[question]) {
            let oldBtn = selectedAnswers[question];
            for (let trait in traitScores) {
                if (oldBtn.hasAttribute(`data-points-${trait}`)) {
                    let points = parseFloat(oldBtn.getAttribute(`data-points-${trait}`));
                    traitScores[trait] -= points;
                }
            }
        }

        // Cộng điểm mới
        for (let trait in traitScores) {
            if (this.hasAttribute(`data-points-${trait}`)) {
                let points = parseFloat(this.getAttribute(`data-points-${trait}`));
                traitScores[trait] += points;
            }
        }

        // Lưu lại nút đã chọn cho câu hỏi
        selectedAnswers[question] = this;

        // Lưu điểm vào localStorage
        localStorage.setItem('traitScores', JSON.stringify(traitScores));

        // Cập nhật tiến trình
        updateProgressBar();
    });
});

// Tính kết quả và chuyển trang
document.getElementById('submitBtn').addEventListener('click', function () {
    const allQuestions = new Set();
    document.querySelectorAll('.btn-answer').forEach(btn => {
        allQuestions.add(btn.getAttribute('data-answer'));
    });

    const unanswered = Array.from(allQuestions).filter(q => !(q in selectedAnswers));

    if (unanswered.length > 0) {
        const firstUnanswered = unanswered[0];
        const firstBtn = document.querySelector(`.btn-answer[data-answer="${firstUnanswered}"]`);

        if (firstBtn) {
            // Cuộn đến câu chưa trả lời
            firstBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Nhấp nháy cảnh báo
            const group = document.querySelectorAll(`.btn-answer[data-answer="${firstUnanswered}"]`);
            group.forEach(btn => {
                btn.classList.add('blink');
                setTimeout(() => btn.classList.remove('blink'), 2000);
            });
        }

        alert("Bạn chưa trả lời hết tất cả câu hỏi!");
        return;
    }

    let mbtiResult = calculateMBTI(traitScores);
    localStorage.setItem('mbtiResult', JSON.stringify(mbtiResult));
    window.location.href = 'result.html';
});

// Hàm tính phần trăm MBTI
function calculateMBTI(scores) {
    function getPercent(a, b) {
        let aMax = maxPointsPerTrait[a];
        let bMax = maxPointsPerTrait[b];
        let percentA = (scores[a] / (aMax + bMax)) * 100;
        let percentB = 100 - percentA;
        return { [a]: Math.round(percentA), [b]: Math.round(percentB) };
    }

    return {
        ...getPercent("e", "i"),
        ...getPercent("s", "n"),
        ...getPercent("t", "f"),
        ...getPercent("j", "p"),
    };
}

// Cập nhật thanh tiến trình
function updateProgressBar() {
    const totalQuestions = new Set();
    document.querySelectorAll('.btn-answer').forEach(btn => {
        totalQuestions.add(btn.getAttribute('data-answer'));
    });

    const answered = Object.keys(selectedAnswers).length;
    const total = totalQuestions.size;
    const percent = Math.round((answered / total) * 100);

    document.getElementById("title-process").textContent = `${answered}/${total} câu`;
    document.getElementById("process-bar").style.width = `${percent}%`;
}

// Gọi updateProgressBar nếu đã có câu trả lời từ trước
window.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('traitScores');
    if (stored) {
        traitScores = JSON.parse(stored);
    }
    updateProgressBar();
});

// Kích hoạt sticky cho tiến trình
window.addEventListener("scroll", function() {
    const sticky = document.getElementById("sticky-progress");

    // Lấy chiều cao của header (vị trí ban đầu của sticky)
    const headerHeight = document.querySelector('header').offsetHeight;

    // Kiểm tra vị trí scroll để thêm hoặc bỏ class 'stuck'
    if (window.scrollY >= headerHeight) {
        sticky.classList.add("stuck");
    } else {
        sticky.classList.remove("stuck");
    }
});


