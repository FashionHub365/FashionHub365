import React, { useState, useEffect, useCallback } from 'react';
import { getProductReviews, respondToReview, toggleReviewVisibility } from '../../../services/productService';
import Swal from 'sweetalert2';

const ReviewManagementModal = ({ product, onClose }) => {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProductReviews(product._id, true);
            const data = res.data || res;
            setReviews(data.reviews || []);
            setSummary(data.summary);
        } catch (err) {
            console.error('Error loading reviews:', err);
            Swal.fire('Error', 'Không thể tải danh sách đánh giá', 'error');
        } finally {
            setLoading(false);
        }
    }, [product._id]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleToggleVisibility = async (review) => {
        try {
            await toggleReviewVisibility(product._id, review._id);
            loadReviews();
            Swal.fire({
                title: 'Thành công',
                text: `Đã ${review.is_hidden ? 'hiện' : 'ẩn'} đánh giá`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể thay đổi trạng thái ẩn hiện', 'error');
        }
    };

    const handleReply = async (reviewId) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await respondToReview(product._id, reviewId, replyText);
            setReplyingTo(null);
            setReplyText('');
            loadReviews();
            Swal.fire({
                title: 'Thành công',
                text: 'Đã gửi phản hồi',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể gửi phản hồi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header - Fixed to match EditProductModal */}
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white flex-none">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý đánh giá</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Sản phẩm: <span className="text-blue-600">{product.name}</span></p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                        title="Đóng"
                    >
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    <div className="px-8 py-6 space-y-8">
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent shadow-sm"></div>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Đang tải...</p>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-4 grayscale">⭐</div>
                                <h3 className="text-xl font-black text-gray-900">Chưa có đánh giá nào</h3>
                                <p className="text-gray-400 mt-1 text-sm font-medium italic">Sản phẩm chưa nhận được phản hồi từ khách hàng.</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Card - Redesigned to match app style */}
                                {summary && (
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-10">
                                        <div className="bg-blue-600 px-6 py-4 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-blue-100">
                                            <div className="text-3xl font-black">{summary.average}</div>
                                            <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Rating</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-lg font-black text-gray-900">{summary.count} Đánh giá tổng quát</div>
                                            <div className="flex gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`text-xl ${i < Math.round(summary.average) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-6">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest pl-2">Danh sách chi tiết</label>
                                    
                                    {reviews.map((review) => (
                                        <div key={review._id} className={`p-6 rounded-3xl border-2 transition-all ${review.is_hidden ? 'bg-gray-50/50 border-gray-100 opacity-75' : 'bg-white border-transparent hover:border-blue-100 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${review.is_hidden ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}>
                                                        {(review.reviewer_info?.name || 'A')[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-gray-900 uppercase tracking-tight">{review.reviewer_info?.name || 'Anonymous'}</h4>
                                                            {review.verified_purchase && (
                                                                <span className="bg-green-100 text-green-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Verified</span>
                                                            )}
                                                            {review.is_hidden && (
                                                                <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Đã ẩn</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex text-amber-400">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={i < review.rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                {review.daysAgo === 0 ? 'Hôm nay' : `${review.daysAgo} ngày trước`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleToggleVisibility(review)}
                                                        className={`p-2.5 rounded-xl transition-all ${review.is_hidden ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                                                        title={review.is_hidden ? "Hiện đánh giá" : "Ẩn đánh giá"}
                                                    >
                                                        {review.is_hidden ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setReplyingTo(replyingTo === review._id ? null : review._id);
                                                            setReplyText(review.seller_response || '');
                                                        }}
                                                        className={`p-2.5 rounded-xl transition-all ${replyingTo === review._id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                                        title="Phản hồi"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pl-2 border-l-2 border-gray-100 ml-6">
                                                <p className="font-black text-gray-900 mb-1 italic">"{review.title}"</p>
                                                <p className="text-gray-600 text-[15px] leading-relaxed font-medium">{review.content}</p>

                                                {(replyingTo === review._id || review.seller_response) && (
                                                    <div className={`mt-6 p-6 rounded-2xl border ${replyingTo === review._id ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Phản hồi của bạn</span>
                                                            </div>
                                                            {!replyingTo && review.seller_response && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setReplyingTo(review._id);
                                                                        setReplyText(review.seller_response);
                                                                    }}
                                                                    className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Chỉnh sửa
                                                                </button>
                                                            )}
                                                        </div>
                                                        {replyingTo === review._id ? (
                                                            <div className="space-y-4">
                                                                <textarea 
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    className="w-full p-4 bg-white border border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium h-32 resize-none shadow-sm"
                                                                    placeholder="Nhập nội dung phản hồi khách hàng..."
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-3">
                                                                    <button 
                                                                        onClick={() => handleReply(review._id)}
                                                                        disabled={submitting || !replyText.trim()}
                                                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                                                    >
                                                                        {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setReplyingTo(null)}
                                                                        className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all"
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-800 text-[15px] italic font-bold">"{review.seller_response}"</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer - Consistent with EditProductModal */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end flex-none">
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 hover:text-gray-700 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 border border-gray-100 shadow-sm"
                    >
                        Đóng cửa sổ
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}} />
        </div>
    );
};

export default ReviewManagementModal;
