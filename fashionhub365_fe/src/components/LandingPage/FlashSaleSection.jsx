import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import flashSaleApi from '../../apis/flashSaleApi';

export const FlashSaleSection = () => {
    const [flashSale, setFlashSale] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlashSale = async () => {
            try {
                const res = await flashSaleApi.getActiveFlashSales();
                if (res.data?.success && res.data.data.length > 0) {
                    setFlashSale(res.data.data[0]); // Get the first active flash sale
                }
            } catch (err) {
                console.error("Failed to load flash sales", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFlashSale();
    }, []);

    useEffect(() => {
        if (!flashSale) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(flashSale.end_time).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(timer);
                setFlashSale(null); // End the flash sale
            } else {
                setTimeLeft({
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [flashSale]);

    if (loading || !flashSale || !flashSale.items || flashSale.items.length === 0) return null;

    return (
        <section className="w-full bg-red-50 py-12 px-4 md:px-[68px]">
            <div className="max-w-[1440px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-6">
                        <h2 className="text-3xl font-bold text-red-600 uppercase italic">⚡ FLASH SALE</h2>

                        {/* Countdown Timer */}
                        <div className="flex gap-2 text-white">
                            <div className="bg-red-600 rounded px-3 py-1.5 font-bold min-w-[40px] text-center">
                                {String(timeLeft.hours).padStart(2, '0')}
                            </div>
                            <span className="text-red-600 font-bold text-xl">:</span>
                            <div className="bg-red-600 rounded px-3 py-1.5 font-bold min-w-[40px] text-center">
                                {String(timeLeft.minutes).padStart(2, '0')}
                            </div>
                            <span className="text-red-600 font-bold text-xl">:</span>
                            <div className="bg-red-600 rounded px-3 py-1.5 font-bold min-w-[40px] text-center">
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {flashSale.items.slice(0, 4).map((item, index) => {
                        const product = item.product_id;
                        if (!product) return null;

                        // Calculate discount percentage
                        const price = product.price || 0;
                        const promoPrice = item.promo_price || price;
                        const discountPercent = price > 0 ? Math.round(((price - promoPrice) / price) * 100) : 0;

                        // Calculate stock progress
                        const sold = item.sold || 0;
                        const total = item.quantity || 1;
                        const progress = Math.min(100, Math.round((sold / total) * 100));

                        return (
                            <Link
                                to={`/product/${product._id}`}
                                key={index}
                                className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-shadow group border border-red-100"
                            >
                                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                    <img
                                        src={product.images?.[0]?.url || 'https://via.placeholder.com/400x533'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {discountPercent > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                            -{discountPercent}%
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-text-100 text-[length:var(--text-100-font-size)] font-[number:var(--text-100-font-weight)] text-x-500 line-clamp-2 min-h-[40px] group-hover:text-red-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                        <span className="text-lg font-bold text-red-600">
                                            {promoPrice.toLocaleString('vi-VN')}₫
                                        </span>
                                        {price > promoPrice && (
                                            <span className="text-xs text-gray-400 line-through">
                                                {price.toLocaleString('vi-VN')}₫
                                            </span>
                                        )}
                                    </div>

                                    {/* Stock Progress */}
                                    <div className="mt-3">
                                        <div className="w-full bg-red-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-red-500 to-orange-400 h-2.5 rounded-full"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-red-600 mt-1 font-medium select-none">
                                            {sold >= total ? 'SOLD OUT' : `Sold ${sold}/${total}`}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
