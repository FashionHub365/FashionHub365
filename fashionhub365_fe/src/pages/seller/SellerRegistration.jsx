import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import storeApi from '../../apis/store.api';
import { Check } from '../../components/Icons';
import { getUserRoleSlugs } from '../../utils/roleUtils';

// Sub-component for form fields to match CheckoutShipping style
const Field = ({ label, id, required, error, ...props }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            id={id}
            required={required}
            className={`w-full px-4 py-3 border text-sm font-text-200 outline-none transition-all
        ${error ? "border-red-400 bg-red-50 focus:border-red-500" : "border-gray-300 focus:border-black focus:ring-1 focus:ring-black/5"}`}
            {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

const SellerRegistration = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const roleSlugs = getUserRoleSlugs(user);
    const [loading, setLoading] = useState(false);
    const [checkingStore, setCheckingStore] = useState(true);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [existingStore, setExistingStore] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        email: user?.email || '',
        phone: user?.profile?.phone || '',
        pickupAddress: '',
        bankAccount: {
            ownerName: '',
            accountNumber: '',
            bankName: '',
        }
    });

    useEffect(() => {
        let active = true;

        const fetchMyStore = async () => {
            try {
                const response = await storeApi.getMyStore();
                const store = response?.data?.store || response?.store || null;
                if (active) {
                    setExistingStore(store);
                }
            } catch (err) {
                if (active) {
                    setExistingStore(null);
                }
            } finally {
                if (active) {
                    setCheckingStore(false);
                }
            }
        };

        fetchMyStore();

        return () => {
            active = false;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormErrors(prev => ({ ...prev, [name]: '' }));
        if (name.startsWith('bank.')) {
            const bankField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                bankAccount: {
                    ...prev.bankAccount,
                    [bankField]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formData.name.trim()) nextErrors.name = 'Vui long nhap ten shop.';
        if (!formData.description.trim()) nextErrors.description = 'Vui long nhap mo ta shop.';

        const email = formData.email.trim();
        if (!email) {
            nextErrors.email = 'Vui long nhap email kinh doanh.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Email khong hop le.';
        }

        if (!formData.phone.trim()) nextErrors.phone = 'Vui long nhap so dien thoai.';
        if (!formData.pickupAddress.trim()) nextErrors.pickupAddress = 'Vui long nhap dia chi lay hang.';
        if (!formData.bankAccount.bankName.trim()) nextErrors['bank.bankName'] = 'Vui long nhap ten ngan hang.';
        if (!formData.bankAccount.ownerName.trim()) nextErrors['bank.ownerName'] = 'Vui long nhap ten chu tai khoan.';
        if (!formData.bankAccount.accountNumber.trim()) nextErrors['bank.accountNumber'] = 'Vui long nhap so tai khoan.';

        return nextErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const nextErrors = validateForm();
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }
        setLoading(true);

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                information: {
                    addressesText: formData.pickupAddress.trim(),
                },
                bank_accounts: [{
                    account_name: formData.bankAccount.ownerName.trim(),
                    account_number: formData.bankAccount.accountNumber.trim(),
                    bank_name: formData.bankAccount.bankName.trim()
                }]
            };

            const response = await storeApi.createStore(payload);
            if (response.success) {
                setExistingStore(response?.data?.store || null);
                setSuccess(true);
            } else {
                setError(response.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình đăng ký.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingStore) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 p-10 text-center shadow-sm">
                    <div className="mx-auto h-10 w-10 rounded-full border-2 border-gray-200 border-t-black animate-spin mb-5" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Dang kiem tra thong tin seller</h2>
                    <p className="text-sm text-gray-500">Vui long doi trong giay lat...</p>
                </div>
            </div>
        );
    }

    if (existingStore && !success) {
        const storeStatus = existingStore.status || 'pending';
        const storeRef = existingStore.uuid || existingStore._id || existingStore.slug;
        const isSeller = roleSlugs.includes('seller');

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 p-10 text-center shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-black text-white mb-6">
                        <Check className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ban da co shop hoac yeu cau seller</h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-2">
                        Shop <strong>{existingStore.name}</strong> da ton tai trong he thong.
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-8">
                        Trang thai hien tai: <strong className="uppercase text-gray-900">{storeStatus}</strong>.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(isSeller ? '/seller/dashboard' : '/profile')}
                            className="w-full bg-black text-white py-4 font-semibold tracking-wider uppercase hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                        >
                            {isSeller ? 'Vao Seller Center' : 'Quay lai Ho so'}
                        </button>
                        {storeRef && (
                            <button
                                onClick={() => navigate(`/stores/${storeRef}`)}
                                className="w-full border border-gray-300 text-gray-800 py-4 font-semibold tracking-wider uppercase hover:bg-gray-50 transition-all active:scale-[0.98]"
                            >
                                Xem Trang Shop
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 p-10 text-center shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-black text-white mb-6">
                        <Check className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-8">
                        Yêu cầu mở Shop của bạn đã được gửi đi. Admin sẽ xét duyệt thông tin của bạn sớm nhất có thể.
                    </p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full bg-black text-white py-4 font-semibold tracking-wider uppercase hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                    >
                        Quay lại Hồ sơ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Top bar style from Checkout */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/textures/landingpage/vector-3.png" alt="FashionHub365" className="h-7 object-contain" />
                    </Link>
                    <span className="text-sm text-gray-500 font-medium">Seller Hub</span>
                    <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        ← Back to Profile
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto w-full px-4 py-12 flex-1">
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="mb-10 text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3 uppercase tracking-tight">Become a Seller</h1>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                                Tham gia cộng đồng FashionHub365 và bắt đầu hành trình kinh doanh của bạn.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {/* Section: Shop Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] whitespace-nowrap">Thông tin Cửa hàng</h3>
                                    <div className="h-px w-full bg-gray-100"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <Field
                                            id="name" label="Tên Cửa hàng" required
                                            name="name" value={formData.name} onChange={handleChange} error={formErrors.name}
                                            placeholder="VD: Minimalist Authentic"
                                        />
                                    </div>
                                    <Field
                                        id="email" label="Email kinh doanh" type="email" required
                                        name="email" value={formData.email} onChange={handleChange} error={formErrors.email}
                                        placeholder="shop@example.com"
                                    />
                                    <Field
                                        id="phone" label="Số điện thoại" required
                                        name="phone" value={formData.phone} onChange={handleChange} error={formErrors.phone}
                                        placeholder="0123 456 789"
                                    />
                                    <div className="md:col-span-2 flex flex-col gap-1.5">
                                        <label htmlFor="description" className="text-sm font-medium text-gray-700">Mô tả Shop<span className="text-red-500 ml-0.5">*</span></label>
                                        <textarea
                                            id="description" name="description" rows="3" value={formData.description} onChange={handleChange} required
                                            className={`w-full px-4 py-3 border text-sm focus:border-black focus:ring-1 focus:ring-black/5 outline-none resize-none transition-all ${formErrors.description ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-300'}`}
                                            placeholder="Giới thiệu đôi nét về cá tính thương hiệu của bạn..."
                                        />
                                        {formErrors.description && <p className="text-xs text-red-500">{formErrors.description}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <Field
                                            id="pickupAddress" label="Địa chỉ lấy hàng" required
                                            name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} error={formErrors.pickupAddress}
                                            placeholder="Số nhà, đường, Quận/Huyện, Tỉnh/Thành phố..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Payment Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em] whitespace-nowrap">Thông tin Thanh toán</h3>
                                    <div className="h-px w-full bg-gray-100"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field
                                        id="bankName" label="Tên Ngân hàng" required
                                        name="bank.bankName" value={formData.bankAccount.bankName} onChange={handleChange} error={formErrors['bank.bankName']}
                                        placeholder="VD: Vietcombank"
                                    />
                                    <Field
                                        id="ownerName" label="Tên chủ tài khoản" required
                                        name="bank.ownerName" value={formData.bankAccount.ownerName} onChange={handleChange} error={formErrors['bank.ownerName']}
                                        placeholder="NGUYEN VAN A"
                                    />
                                    <div className="md:col-span-2">
                                        <Field
                                            id="accountNumber" label="Số tài khoản" required
                                            name="bank.accountNumber" value={formData.bankAccount.accountNumber} onChange={handleChange} error={formErrors['bank.accountNumber']}
                                            placeholder="0071 0000 12345"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-4 font-semibold tracking-wider uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <>
                                            Gửi yêu cầu – Register Store
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                <p className="mt-6 text-center text-[11px] text-gray-400 font-medium uppercase tracking-[0.05em]">
                                    Bằng việc tiếp tục, bạn đồng ý với <Link to="/terms" className="text-gray-900 underline">Điều khoản dịch vụ</Link> của chúng tôi.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerRegistration;
