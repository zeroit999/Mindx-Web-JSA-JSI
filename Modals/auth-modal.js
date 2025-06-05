import {
    auth,
    db,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    doc,
    setDoc,
    updateDoc,
    onAuthStateChanged,
    signOut
} from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements...
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const showLoginModal = document.getElementById('showLoginModal');
    const showSignupModal = document.getElementById('showSignupModal');
    const switchToLogin = document.getElementById('switchToLogin');
    const switchToSignup = document.getElementById('switchToSignup');
    const closeButtons = document.querySelectorAll('.close-modal');

    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error-message');
    const googleLoginBtn = document.getElementById('google-login-btn');

    const signupForm = document.getElementById('signup-form');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('confirm-password');
    const signupError = document.getElementById('signup-error-message');
    const googleSignupBtn = document.getElementById('google-signup-btn');

    const signupLink = document.getElementById('signupLink');
    const loginLink = document.getElementById('loginLink');
    const userLogoContainer = document.getElementById('userLogoContainer');
    const userLogo = document.getElementById('userLogo');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    function openModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        clearError(modal === loginModal ? loginError : signupError);
    }

    function clearError(errorElement) {
        if (errorElement) errorElement.textContent = '';
    }

    // Modal UI Events
    showLoginModal?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(loginModal);
    });

    showSignupModal?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(signupModal);
    });

    switchToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(signupModal);
        openModal(loginModal);
    });

    switchToSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(signupModal);
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.auth-modal');
            closeModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === signupModal) closeModal(signupModal);
    });

    if (userLogo && userMenu) {
        userLogo.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            userMenu.style.display = 'none';
        });

        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    async function handleLoginSuccess(user) {
        console.log('Đăng nhập thành công:', user.uid);
        localStorage.setItem('loggedInUserId', user.uid);

        const userDoc = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDoc, {
                last_login: new Date().toISOString(),
                email: user.email,
                displayName: user.displayName || 'Người dùng',
                photoURL: user.photoURL || ''
            });
        } catch (err) {
            console.warn("Không thể cập nhật last_login:", err);
        }

        if (signupLink && loginLink && userLogoContainer && userLogo) {
            signupLink.style.display = 'none';
            loginLink.style.display = 'none';
            userLogo.src = user.photoURL || './Logo.svg';
            userLogoContainer.style.display = 'block';
        }

        closeModal(loginModal);
        closeModal(signupModal);
    }

    // Đăng nhập bằng email
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearError(loginError);

            const email = loginEmail.value.trim();
            const password = loginPassword.value;

            if (!email || !password) {
                loginError.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu!';
                return;
            }

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    handleLoginSuccess(userCredential.user);
                })
                .catch((error) => {
                    loginError.textContent = 'Lỗi đăng nhập: ' + error.message;
                });
        });
    }

    // Đăng nhập Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            clearError(loginError);
            const provider = new GoogleAuthProvider();

            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                const userDoc = doc(db, 'users', user.uid);

                await setDoc(userDoc, {
                    email: user.email,
                    displayName: user.displayName || 'Người dùng Google',
                    photoURL: user.photoURL || '',
                    provider: 'google.com',
                    lastLogin: new Date().toISOString(),
                    profile: {
                        name: '',
                        dob: '',
                        gender: '',
                        fav_career: '',
                        career_orientation: '',
                        strengths: '',
                        weaknesses: '',
                        mbti: ''
                    }
                }, { merge: true });

                handleLoginSuccess(user);
            } catch (error) {
                loginError.textContent = 'Lỗi Google: ' + error.message;
            }
        });
    }

    // Đăng ký email/password
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError(signupError);

            const email = signupEmail.value.trim();
            const password = signupPassword.value;
            const confirmPass = confirmPassword.value;

            if (!email || !password || !confirmPass) {
                signupError.textContent = 'Vui lòng điền đầy đủ thông tin.';
                return;
            }
            if (password.length < 6) {
                signupError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
                return;
            }
            if (password !== confirmPass) {
                signupError.textContent = 'Mật khẩu và xác nhận không khớp.';
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userDoc = doc(db, 'users', user.uid);

                await setDoc(userDoc, {
                    email,
                    provider: 'email/password',
                    createdAt: new Date().toISOString(),
                    profile: {
                        name: '',
                        dob: '',
                        gender: '',
                        fav_career: '',
                        career_orientation: '',
                        strengths: '',
                        weaknesses: '',
                        mbti: ''
                    }
                });

                handleLoginSuccess(user);
            } catch (error) {
                signupError.textContent = 'Lỗi đăng ký: ' + error.message;
            }
        });
    }

    // Đăng ký bằng Google
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', async () => {
            clearError(signupError);
            const provider = new GoogleAuthProvider();

            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                const userDoc = doc(db, 'users', user.uid);

                await setDoc(userDoc, {
                    email: user.email,
                    displayName: user.displayName || 'Người dùng Google',
                    photoURL: user.photoURL || '',
                    provider: 'google.com',
                    createdAt: new Date().toISOString(),
                    profile: {
                        name: '',
                        dob: '',
                        gender: '',
                        fav_career: '',
                        career_orientation: '',
                        strengths: '',
                        weaknesses: '',
                        mbti: ''
                    }
                }, { merge: true });

                handleLoginSuccess(user);
            } catch (error) {
                signupError.textContent = 'Lỗi Google: ' + error.message;
            }
        });
    }

    // Đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            localStorage.removeItem('loggedInUserId');
            signupLink.style.display = 'block';
            loginLink.style.display = 'block';
            userLogoContainer.style.display = 'none';
        });
    }

    // Xử lý giao diện khi đã đăng nhập
    onAuthStateChanged(auth, (user) => {
        if (user) {
            signupLink.style.display = 'none';
            loginLink.style.display = 'none';
            userLogo.src = user.photoURL || './Logo.svg';
            userLogoContainer.style.display = 'block';
        } else {
            signupLink.style.display = 'block';
            loginLink.style.display = 'block';
            userLogoContainer.style.display = 'none';
        }
    });
});
