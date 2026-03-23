import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../apis/userApi';
import { toast } from 'react-toastify';
import { showSuccess, showError } from '../../utils/swalUtils';

const SellerProfile = () => {
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        bio: '',
        gender: 'other',
        dob: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.profile?.full_name || '',
                phone: user.profile?.phone || '',
                bio: user.profile?.bio || '',
                gender: user.profile?.gender || 'other',
                dob: user.profile?.dob ? new Date(user.profile.dob).toISOString().split('T')[0] : '',
            });
            setPreviewUrl(user.profile?.avatar_url || null);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value);
            });

            if (fileInputRef.current?.files[0]) {
                submitData.append('avatar', fileInputRef.current.files[0]);
            }

            const response = await userApi.updateProfile(submitData);
            if (response.success) {
                const updatedUser = response.data.user;
                updateUserProfile(updatedUser);
                showSuccess('Cập nhật hồ sơ thành công!');
            }
        } catch (err) {
            console.error('Update profile error:', err);
            showError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
        } finally {
            setLoading(false);
        }
    };

    const getInitial = () => {
        return (formData.full_name || user?.username || 'S').charAt(0).toUpperCase();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-10">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 flex items-end gap-6 mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white bg-slate-100 shadow-md overflow-hidden flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-slate-400">{getInitial()}</span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-white text-xs font-bold"
                            >
                                Thay đổi ảnh
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <div className="pb-2">
                            <h2 className="text-2xl font-bold text-slate-900">{formData.full_name || user?.username}</h2>
                            <p className="text-slate-500 font-medium">@{user?.username || 'seller'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Họ và tên</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                    placeholder="Nhập họ tên của bạn"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                    placeholder="098xxxxxxxx"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Giới tính</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white"
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Ngày sinh</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Giới thiệu bản thân (Bio)</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                                placeholder="Viết một đoạn ngắn giới thiệu về bản thân hoặc phong cách của bạn..."
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading && (
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                        <p className="text-slate-700 font-medium">{user?.email}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Vai trò</p>
                        <div className="flex gap-2">
                            {user?.global_role_ids?.map(role => (
                                <span key={role._id || role.slug} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wide">
                                    {role.name || role.slug}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerProfile;
