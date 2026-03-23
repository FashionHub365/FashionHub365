import Swal from 'sweetalert2';

/**
 * Hiển thị thông báo xác nhận (thay thế window.confirm)
 */
export const confirmAction = async ({
    title = 'Xác nhận',
    text = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    icon = 'warning',
    confirmButtonText = 'Đồng ý',
    cancelButtonText = 'Hủy',
    confirmButtonColor = '#4f46e5',
    cancelButtonColor = '#f1f5f9',
    customClass = {
        confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 transition-all hover:scale-105 active:scale-95',
        cancelButton: 'px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 transition-all hover:bg-slate-200'
    }
}) => {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor,
        cancelButtonColor,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
            ...customClass,
            popup: 'rounded-3xl border-none shadow-2xl p-8',
            title: 'text-2xl font-black text-slate-800 pt-2',
            htmlContainer: 'text-slate-500 font-medium pb-4',
            actions: 'gap-3 mt-4'
        }
    });
    return result.isConfirmed;
};

/**
 * Hiển thị thông báo thông thường (thay thế alert)
 */
export const showAlert = ({
    title = '',
    text = '',
    icon = 'info',
    timer = 3000,
    showConfirmButton = false
}) => {
    return Swal.fire({
        title,
        text,
        icon,
        timer,
        showConfirmButton,
        timerProgressBar: true,
        customClass: {
            popup: 'rounded-3xl border-none shadow-xl p-6',
            title: 'text-xl font-bold text-slate-800',
            htmlContainer: 'text-slate-500 pb-2',
            confirmButton: 'px-6 py-2 rounded-xl font-bold text-white bg-indigo-600'
        },
        buttonsStyling: false
    });
};

/**
 * Thông báo thành công nhanh
 */
export const showSuccess = (message) => {
    return showAlert({
        title: 'Thành công!',
        text: message,
        icon: 'success'
    });
};

/**
 * Thông báo lỗi nhanh
 */
export const showError = (message) => {
    return showAlert({
        title: 'Lỗi!',
        text: message,
        icon: 'error',
        timer: 5000,
        showConfirmButton: true,
        customClass: {
        }
    });
};

/**
 * Thông báo yêu cầu đăng nhập
 */
export const showLoginRequired = async (navigate, message = 'vào giỏ hàng') => {
    const isConfirmed = await confirmAction({
        title: 'Yêu cầu đăng nhập',
        text: `Bạn cần đăng nhập để thực hiện hành động ${message}.`,
        icon: 'info',
        confirmButtonText: 'Đăng nhập ngay',
        cancelButtonText: 'Để sau',
        confirmButtonColor: '#000000',
    });

    if (isConfirmed) {
        navigate('/login');
    }
    return isConfirmed;
};
