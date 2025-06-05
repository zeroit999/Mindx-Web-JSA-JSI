import { auth } from "../../auth.js";
import { saveTestResult } from "../../savetest.js";

const scores = JSON.parse(localStorage.getItem('traitScores')) || { e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0 };

function createBar(trait1, trait2) {
    const total1 = scores[trait1] ?? 0;
    const total2 = scores[trait2] ?? 0;
    const sum = total1 + total2;

    const percent1 = sum > 0 ? Math.round((total1 / sum) * 100) : 50;
    const percent2 = 100 - percent1;

    const container = document.createElement('div');
    container.innerHTML = `
        <div class="bar-label">${trait1.toUpperCase()} / ${trait2.toUpperCase()} (${percent1}% / ${percent2}%)</div>
        <div class="progress-bar">
            <div class="bar-inner">
                <div class="bar-${trait1}" style="width: ${percent1}%">${percent1 > 10 ? `${percent1}%` : ''}</div>
                <div class="bar-${trait2}" style="width: ${percent2}%">${percent2 > 10 ? `${percent2}%` : ''}</div>
            </div>
        </div>
    `;
    return container;
}

// Màu và mô tả MBTI
const mbtiDescriptions = {
    "INFJ": { 
        color: "#9575CD", 
        desc: "<span class='highlight'>INFJ - Người cố vấn:</span> <span class='normal'>Trực giác, sâu sắc, lý tưởng hóa. Luôn tìm kiếm ý nghĩa và truyền cảm hứng, có khả năng thấu hiểu người khác và luôn đặt ra những mục tiêu cao cả.</span>"
    },
    "INTJ": { 
        color: "#263238", 
        desc: "<span class='highlight'>INTJ - Người chiến lược:</span> <span class='normal'>Chiến lược, độc lập, thích cải tiến hệ thống và có tầm nhìn xa. Luôn phân tích vấn đề một cách logic và tìm kiếm giải pháp sáng tạo.</span>"
    },
    "INFP": { 
        color: "#F8BBD0", 
        desc: "<span class='highlight'>INFP - Người lý tưởng:</span> <span class='normal'>Sáng tạo, sống nội tâm và theo lý tưởng cá nhân một cách chân thành. Luôn tìm kiếm những giá trị sâu sắc và mang lại sự thay đổi tích cực cho xã hội.</span>"
    },
    "INTP": { 
        color: "#64B5F6", 
        desc: "<span class='highlight'>INTP - Người lý thuyết:</span> <span class='normal'>Tư duy sắc bén, yêu thích logic, ý tưởng trừu tượng và khám phá. Có khả năng phân tích các vấn đề một cách tỉ mỉ và tìm ra các giải pháp hiệu quả.</span>"
    },
    "ENFP": { 
        color: "#BA68C8", 
        desc: "<span class='highlight'>ENFP - Người tiên phong:</span> <span class='normal'>Nhiệt huyết, đầy năng lượng, luôn truyền cảm hứng và sáng tạo. Đam mê khám phá thế giới và luôn sẵn sàng đưa ra những sáng kiến mới.</span>"
    },
    "ENTP": { 
        color: "#4FC3F7", 
        desc: "<span class='highlight'>ENTP - Người đổi mới:</span> <span class='normal'>Linh hoạt, thích tranh luận, đam mê đổi mới và góc nhìn mới. Có khả năng tạo ra những ý tưởng táo bạo và dẫn đầu sự thay đổi.</span>"
    },
    "ENFJ": { 
        color: "#42A5F5", 
        desc: "<span class='highlight'>ENFJ - Người lãnh đạo:</span> <span class='normal'>Lôi cuốn, dẫn dắt bằng cảm hứng, luôn hướng đến lợi ích tập thể. Có khả năng gắn kết mọi người và tạo ra những tác động tích cực trong cộng đồng.</span>"
    },
    "ENTJ": { 
        color: "#6A1B9A", 
        desc: "<span class='highlight'>ENTJ - Người lãnh đạo quyết đoán:</span> <span class='normal'>Lãnh đạo, quyết đoán và có khả năng tổ chức hệ thống hiệu quả. Luôn có tầm nhìn rõ ràng và kiên định trong việc đạt được mục tiêu lớn.</span>"
    },
    "ISTJ": { 
        color: "#6D4C41", 
        desc: "<span class='highlight'>ISTJ - Người thực dụng:</span> <span class='normal'>Ngăn nắp, logic và rất đáng tin cậy trong công việc. Được biết đến với sự chuẩn xác và tận tâm trong mọi nhiệm vụ.</span>"
    },
    "ISFJ": { 
        color: "#90CAF9", 
        desc: "<span class='highlight'>ISFJ - Người bảo vệ:</span> <span class='normal'>Chu đáo, trung thành, quan tâm đến người khác một cách âm thầm. Luôn đặt lợi ích người khác lên hàng đầu và làm việc với sự tỉ mỉ.</span>"
    },
    "ISTP": { 
        color: "#78909C", 
        desc: "<span class='highlight'>ISTP - Người thợ thủ công:</span> <span class='normal'>Thực tế, tò mò, yêu thích phân tích và xử lý bằng hành động. Giỏi trong việc giải quyết các vấn đề thực tế với giải pháp nhanh chóng.</span>"
    },
    "ISFP": { 
        color: "#A5D6A7", 
        desc: "<span class='highlight'>ISFP - Người nghệ sĩ:</span> <span class='normal'>Dịu dàng, nghệ sĩ, sống theo cảm xúc và yêu cái đẹp. Tìm kiếm sự hài hòa và sáng tạo trong mọi thứ xung quanh.</span>"
    },
    "ESTP": { 
        color: "#E53935", 
        desc: "<span class='highlight'>ESTP - Người mạo hiểm:</span> <span class='normal'>Hành động nhanh, mạo hiểm, linh hoạt và thích chinh phục. Có khả năng xử lý tình huống một cách quyết đoán và đầy tự tin.</span>"
    },
    "ESFP": { 
        color: "#FFB74D", 
        desc: "<span class='highlight'>ESFP - Người năng động:</span> <span class='normal'>Vui vẻ, thích sự náo nhiệt, luôn khuấy động không khí xung quanh. Luôn sẵn sàng mang lại niềm vui và tạo ra những khoảnh khắc đặc biệt.</span>"
    },
    "ESTJ": { 
        color: "#D84315", 
        desc: "<span class='highlight'>ESTJ - Người tổ chức:</span> <span class='normal'>Thực tế, quyết đoán, có khả năng quản lý và lãnh đạo nhóm. Được đánh giá cao với khả năng đưa ra những quyết định chắc chắn và hiệu quả.</span>"
    },
    "ESFJ": { 
        color: "#F48FB1", 
        desc: "<span class='highlight'>ESFJ - Người chăm sóc:</span> <span class='normal'>Hòa đồng, thân thiện, thích giúp đỡ và gắn kết cộng đồng. Luôn tìm kiếm sự hòa hợp và yêu thương mọi người xung quanh.</span>"
    }
};

function getMBTIType() {
    return [
        scores.e > scores.i ? 'E' : 'I',
        scores.s > scores.n ? 'S' : 'N',
        scores.t > scores.f ? 'T' : 'F',
        scores.j > scores.p ? 'J' : 'P'
    ].join('');
}

// Tính loại MBTI và hiển thị kết quả
const mbtiResult = getMBTIType();
const mbtiContainer = document.getElementById('mbti-result');
const { color, desc } = mbtiDescriptions[mbtiResult] || { color: "#333", desc: "Không xác định." };

mbtiContainer.innerHTML = `
    <div class="mbti-type" style="color: ${color}">${mbtiResult}</div>
    <div class="mbti-desc">${desc}</div>
`;

const pairs = [['e', 'i'], ['s', 'n'], ['t', 'f'], ['j', 'p']];
const barContainer = document.getElementById('result-bars');
pairs.forEach(([t1, t2]) => barContainer.appendChild(createBar(t1, t2)));

// Lưu kết quả vào Firestore
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const resultData = {
                ...scores,
                type: mbtiResult
            };
            await saveTestResult(user.uid, "MBTI", resultData);
        } catch (error) {
            console.error("Không thể lưu kết quả MBTI:", error);
            alert("Không thể lưu kết quả bài kiểm tra. Vui lòng thử lại sau.");
        }
    } else {
        console.log("Không có người dùng đăng nhập. Kết quả không được lưu.");
    }
});