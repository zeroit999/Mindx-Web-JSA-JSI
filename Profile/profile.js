import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onAuthStateChanged,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL,
  collection,
  getDocs
} from '../auth.js';
import { updateProfile } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js"; // Cập nhật phiên bản Firebase

document.addEventListener('DOMContentLoaded', () => {
  const displayName = document.getElementById('display-name');
  const displayDob = document.getElementById('display-dob');
  const displayGender = document.getElementById('display-gender');
  const displayFavCareer = document.getElementById('display-fav-career');
  const displayCareerOrientation = document.getElementById('display-career-orientation');
  const displayStrengths = document.getElementById('display-strengths');
  const displayWeaknesses = document.getElementById('display-weaknesses');
  const displayMbti = document.getElementById('display-mbti');
  const updateProfileLink = document.getElementById('update-profile-link');
  const modal = document.getElementById('update-profile-modal');
  const closeButton = document.querySelector('.modal .close-button');
  const profileForm = document.getElementById('profile-form');
  const changeAvatarLink = document.getElementById('change-avatar-link');
  const testHistoryLink = document.getElementById('test-history-link');
  const testHistoryModal = document.getElementById('test-history-modal');
  const testHistoryCloseButton = testHistoryModal?.querySelector('.close-button');
  const testHistoryContent = document.getElementById('test-history-content');

  let currentUserId = null;
  let currentUserProfileData = {};

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      await loadUserProfile(currentUserId);
    } else {
      window.location.href = '../index.html';
    }
  });

  async function loadUserProfile(userId) {
    const userDoc = doc(db, 'users', userId);
    const snapshot = await getDoc(userDoc);

    if (snapshot.exists()) {
      currentUserProfileData = snapshot.data().profile || {};
      displayProfileData(currentUserProfileData);
      prefillProfileForm(currentUserProfileData);
    } else {
      displayProfileData({});
    }

    const profileAvatarImg = document.getElementById('profile-avatar-img');
    if (auth.currentUser && profileAvatarImg) {
      profileAvatarImg.src = auth.currentUser.photoURL || '../Logo.svg';
    }
  }

  function displayProfileData(data) {
    const defaultText = 'Chưa cập nhật';
    displayName.textContent = data.name || defaultText;
    displayDob.textContent = data.dob || defaultText;
    displayGender.textContent = data.gender || defaultText;
    displayFavCareer.textContent = data.fav_career || defaultText;
    displayCareerOrientation.textContent = data.career_orientation || defaultText;
    displayStrengths.textContent = data.strengths || defaultText;
    displayWeaknesses.textContent = data.weaknesses || defaultText;
    displayMbti.textContent = data.mbti || defaultText;
  }

  if (updateProfileLink) {
    updateProfileLink.addEventListener('click', () => {
      modal.style.display = 'block';
      prefillProfileForm(currentUserProfileData);
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => modal.style.display = 'none');
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  function prefillProfileForm(data) {
    document.getElementById('fullname').value = data?.name || '';
    document.getElementById('dob').value = data?.dob || '';
    document.getElementById('gender').value = data?.gender || '';
    document.getElementById('career').value = data?.fav_career || '';
    document.getElementById('orientation').value = data?.career_orientation || '';
    document.getElementById('strengths').value = data?.strengths || '';
    document.getElementById('weaknesses').value = data?.weaknesses || '';
    document.getElementById('mbti').value = data?.mbti || '';
  }

  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return alert("Chưa xác định người dùng");

    const updatedData = {
      name: document.getElementById('fullname').value.trim(),
      dob: document.getElementById('dob').value,
      gender: document.getElementById('gender').value,
      fav_career: document.getElementById('career').value.trim(),
      career_orientation: document.getElementById('orientation').value.trim(),
      strengths: document.getElementById('strengths').value.trim(),
      weaknesses: document.getElementById('weaknesses').value.trim(),
      mbti: document.getElementById('mbti').value.trim().toUpperCase(),
    };

    try {
      await updateDoc(doc(db, 'users', currentUserId), { profile: updatedData });
      displayProfileData(updatedData);
      modal.style.display = 'none';
    } catch (err) {
      alert("Lỗi khi lưu hồ sơ: " + err.message);
    }
  });

  if (changeAvatarLink) {
    changeAvatarLink.addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUserId) return;

        try {
          const avatarRef = storageRef(storage, `avatars/${currentUserId}/${file.name}`);
          await uploadBytes(avatarRef, file);
          const photoURL = await getDownloadURL(avatarRef);
          await updateProfile(auth.currentUser, { photoURL });

          document.getElementById('profile-avatar-img').src = photoURL;
          document.getElementById('userLogo').src = photoURL;
        } catch (err) {
          alert("Lỗi khi tải ảnh lên: " + err.message);
        }
      };
      input.click();
    });
  }

  if (testHistoryLink) {
    testHistoryLink.addEventListener('click', async () => {
      testHistoryModal.style.display = 'block';
      await loadTestHistory(currentUserId);
    });
  }

  if (testHistoryCloseButton) {
    testHistoryCloseButton.addEventListener('click', () => {
      testHistoryModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === testHistoryModal) {
      testHistoryModal.style.display = 'none';
    }
  });

  async function loadTestHistory(userId) {
    if (!userId) {
      testHistoryContent.innerHTML = '<p>Không tìm thấy người dùng.</p>';
      return;
    }

    try {
      const testResultsRef = collection(db, 'testResults', userId, 'results');
      const querySnapshot = await getDocs(testResultsRef);

      if (querySnapshot.empty) {
        testHistoryContent.innerHTML = '<p>Chưa có bài kiểm tra nào.</p>';
        return;
      }

      let historyHTML = '<ul style="list-style: none; padding: 0;">';
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const testType = data.testType;
        const timestamp = new Date(data.timestamp).toLocaleString('vi-VN');
        const result = data.result;

        let resultSummary = '';
        if (testType === 'MBTI') {
          resultSummary = `Kết quả: ${result.type} (E: ${result.e}%, I: ${result.i}%, S: ${result.s}%, N: ${result.n}%, T: ${result.t}%, F: ${result.f}%, J: ${result.j}%, P: ${result.p}%)`;
        } else {
          resultSummary = JSON.stringify(result);
        }

        historyHTML += `
          <li style="margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #e0e4e8;">
            <strong>${testType}</strong><br>
            <span>Thời gian: ${timestamp}</span><br>
            <span>${resultSummary}</span>
          </li>
        `;
      });
      historyHTML += '</ul>';
      testHistoryContent.innerHTML = historyHTML;
    } catch (err) {
      console.error('Lỗi khi tải lịch sử kiểm tra:', err);
      testHistoryContent.innerHTML = '<p>Lỗi khi tải lịch sử kiểm tra: ' + err.message + '</p>';
    }
  }
});