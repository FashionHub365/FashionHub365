import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import campaignApi from '../../apis/campaignApi';

export const CampaignBannersSection = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await campaignApi.getActiveCampaigns();
                if (res.data?.success) {
                    setCampaigns(res.data.data);
                }
            } catch (err) {
                console.error("Failed to load campaigns", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    if (loading || campaigns.length === 0) return null;

    return (
        <section className="w-full py-8 px-4 md:px-[68px] bg-white">
            <div className="max-w-[1440px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.slice(0, 3).map((campaign, idx) => (
                        <Link
                            to={`/listing?campaign=${campaign._id}`}
                            key={campaign._id}
                            className={`group relative overflow-hidden rounded-2xl aspect-[16/9] shadow-md hover:shadow-xl transition-all ${idx === 0 && campaigns.length === 3 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                        >
                            <img
                                src={campaign.banner_url || `https://source.unsplash.com/800x600/?fashion,sale&sig=${idx}`}
                                alt={campaign.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                            <div className="absolute inset-x-0 bottom-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-500">
                                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                                    Special Campaign
                                </span>
                                <h3 className="text-2xl font-bold mb-2 leading-tight">
                                    {campaign.name}
                                </h3>
                                <p className="text-sm text-gray-200 line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    {campaign.description}
                                </p>
                                <div className="inline-flex items-center text-sm font-semibold hover:text-indigo-300 transition-colors">
                                    Shop Now
                                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};
