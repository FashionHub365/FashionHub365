import React, { useState, useEffect } from "react";
import storeApi from "../../apis/store.api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const StoreHeader = ({ store, totalProducts }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Safe data extraction with real data priority
  const sellerName = store?.owner_user_id?.profile?.full_name;
  const storeName = sellerName || store?.name || store?.information?.name || "Gian hàng đối tác";
  const isPremium = store?.level?.value === 'premium';
  const ratingAverage = store?.rating_summary?.avgStars?.toFixed(1) || "0.0";
  const ratingCount = store?.rating_summary?.totalRatings || 0;

  // Format join date
  const getJoinedTime = () => {
    if (!store?.created_at) return "Mới tham gia";
    const joinedDate = new Date(store.created_at);
    const now = new Date();
    const years = now.getFullYear() - joinedDate.getFullYear();
    const months = (now.getFullYear() - joinedDate.getFullYear()) * 12 + (now.getMonth() - joinedDate.getMonth());

    if (years > 0) return `${years} Năm Trước`;
    if (months > 0) return `${months} Tháng Trước`;
    return "Tháng này";
  };

  useEffect(() => {
    if (store?._id) {
      if (user) {
        storeApi.getFollowingStatus(store._id)
          .then(res => {
            if (res.success) setIsFollowing(res.data.isFollowing);
          })
          .catch(console.error);
      }

      storeApi.getFollowerCount(store._id)
        .then(res => {
          if (res.success) setFollowerCount(res.data.count);
        })
        .catch(console.error);
    }
  }, [store?._id, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!store?._id || loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        const res = await storeApi.unfollowStore(store._id);
        if (res.success) {
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const res = await storeApi.followStore(store._id);
        if (res.success) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("Error toggling follow status:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowerCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count;
  };

  // Bootstrap Icons as SVGs
  const Icons = {
    Bag: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z" />
      </svg>
    ),
    PersonPlus: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path fillRule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z" />
      </svg>
    ),
    ChatDots: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
        <path d="M2.165 15.803l.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a1.072 1.072 0 0 0 1.242 1.258l.122-.047zM8 2c3.866 0 7 2.686 7 6s-3.134 6-7 6a7.126 7.126 0 0 1-2.908-.614l-.427-.196-.807.16a11.137 11.137 0 0 0 .524-1.105l.133-.306-.296-.282A6.16 6.16 0 0 1 3 8c0-3.314 3.134-6 7-6z" />
      </svg>
    ),
    People: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      </svg>
    ),
    Star: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.593l-.837-4.72 3.422-3.337c.33-.321.124-.877-.333-.942l-4.739-.691L8.646 2.354c-.204-.413-.787-.413-.99 0L5.479 6.711l-4.738.691c-.457.065-.663.621-.333.942l3.422 3.337-.837 4.72zm5.134-1.256L4.35 15.655l.892-5.03L1.587 7.042l5.054-.737L9 1.716l2.359 4.589 5.054.737-3.655 3.582.892 5.03L9 13.594z" />
      </svg>
    ),
    Calendar: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
      </svg>
    ),
    Shop: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.371 2.371 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976l2.61-3.044zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.458-.725L12.394 1.5H3.606L1.242 4.9a1.375 1.375 0 0 0 2.458.725.5.5 0 0 1 1 0zM5 8a.5.5 0 0 1 .5.5V11h5V8.5a.5.5 0 0 1 1 0V12a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V8.5A.5.5 0 0 1 5 8zm1.5 2h3v1h-3v-1z" />
      </svg>
    ),
  };

  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">

          {/* Left: Shopee Store Profile Card */}
          <div className="lg:w-[390px] h-36 relative rounded overflow-hidden shrink-0 shadow-lg border border-gray-100">
            <div className="absolute inset-0 bg-black/60 z-0">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-[2px]"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80')" }}>
              </div>
            </div>

            <div className="relative z-10 p-4 flex flex-col h-full justify-between">
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-white/30 p-1 bg-white/10 backdrop-blur-sm">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl overflow-hidden shadow-inner font-bold text-[#ee4d2d]">
                      {store?.avatar ? (
                        <img src={store.avatar} alt={storeName} className="w-full h-full object-cover" />
                      ) : store?.name ? (
                        storeName.charAt(0).toUpperCase()
                      ) : (
                        <Icons.Shop />
                      )}
                    </div>
                  </div>
                  {isPremium && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ee4d2d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-white/20">
                      Shopee Mall
                    </div>
                  )}
                </div>

                <div className="flex-1 text-white flex flex-col justify-center min-w-0">
                  <h2 className="text-base md:text-[17px] font-bold truncate leading-tight drop-shadow-md uppercase">{storeName}</h2>
                  <p className="text-[10px] text-white/90 mt-1 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse border border-white/20"></span>
                    Đang Hoạt Động
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={handleFollowToggle}
                  className={`flex-1 py-1.5 border border-white/50 text-white rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 uppercase tracking-tight
                      ${isFollowing ? 'bg-white/20 hover:bg-white/30' : 'bg-transparent hover:bg-white/10'}`}
                >
                  <span className="text-base leading-none font-normal">{isFollowing ? '✓' : '+'}</span> {isFollowing ? 'Đang Theo Dõi' : 'Theo Dõi'}
                </button>
                <button className="flex-1 py-1.5 bg-transparent border border-white/50 text-white rounded text-[10px] font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-1 uppercase tracking-tight">
                  <Icons.ChatDots />
                  Chat
                </button>
              </div>
            </div>
          </div>

          {/* Right: Store Stats Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-5 items-center px-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400"><Icons.Bag /></span>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium">Sản phẩm:</span>
                <span className="text-sm text-[#ee4d2d] font-bold uppercase">{totalProducts || 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400"><Icons.PersonPlus /></span>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium">Đang theo dõi:</span>
                <span className="text-sm text-[#ee4d2d] font-bold uppercase">5</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400"><Icons.ChatDots /></span>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium">Tỷ lệ phản hồi:</span>
                <span className="text-sm text-[#ee4d2d] font-bold uppercase">{store?.response_rate || 87}%</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400"><Icons.People /></span>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium">Người theo dõi:</span>
                <span className="text-sm text-[#ee4d2d] font-bold uppercase">{formatFollowerCount(followerCount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400"><Icons.Star /></span>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium">Đánh giá:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-[#ee4d2d] font-bold uppercase">{ratingAverage}</span>
                  <span className="text-[10px] text-gray-400 font-normal">({ratingCount} đánh giá)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400"><Icons.Calendar /></span>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500 font-medium">Tham gia:</span>
                <span className="text-sm text-[#ee4d2d] font-bold uppercase">{getJoinedTime()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

