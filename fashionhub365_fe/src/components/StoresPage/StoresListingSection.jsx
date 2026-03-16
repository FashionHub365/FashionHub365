import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import storeApi from "../../apis/store.api";

const FALLBACK_IMAGES = [
    "/textures/storespage/image.jpg",
    "/textures/storespage/image1.jpg",
    "/textures/storespage/image2.jpg",
    "/textures/storespage/image3.jpg",
    "/textures/storespage/image4.jpg",
    "/textures/storespage/image5.jpg",
    "/textures/storespage/image6.jpg",
    "/textures/storespage/image7.jpg",
    "/textures/storespage/image8.jpg",
];

const getStoreLocation = (store) => {
    if (store?.information?.addressesText) return store.information.addressesText;
    if (Array.isArray(store?.addresses) && store.addresses.length > 0) {
        const address = store.addresses[0];
        if (typeof address === "string") return address;
        return [address.line1, address.line2, address.ward, address.district, address.city].filter(Boolean).join(", ");
    }
    return "Online store";
};

const getStoreImage = (store, index) => {
    const info = store?.information || {};
    return info.banner || info.coverImage || info.logo || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
};

export const StoresListingSection = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        const run = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await storeApi.listStores({ page: 1, limit: 30, sort: "rating" });
                if (!active) return;
                if (res.success) setStores(res.data?.stores || []);
            } catch (e) {
                if (!active) return;
                setError(e?.response?.data?.message || "Cannot load stores.");
            } finally {
                if (active) setLoading(false);
            }
        };

        run();
        return () => {
            active = false;
        };
    }, []);

    const subtitle = useMemo(() => {
        if (loading) return "Loading stores...";
        return `Find one of our ${stores.length} stores.`;
    }, [loading, stores.length]);

    return (
        <section className="relative flex w-full flex-col items-center gap-10 px-6 py-10 md:px-10">
            <header className="flex w-full flex-col items-center gap-3">
                <h2 className="text-center text-3xl font-bold text-x-600 md:text-4xl">Stores</h2>
                <p className="text-center text-sm text-x-600/80">{subtitle}</p>
            </header>

            {error && (
                <div className="w-full max-w-4xl rounded-lg border border-rose-200 bg-rose-50 p-3 text-center text-sm text-rose-700">
                    {error}
                </div>
            )}

            {loading && (
                <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-3">
                            <div className="h-56 rounded-lg bg-gray-100" />
                            <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
                            <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && stores.length === 0 && (
                <div className="w-full max-w-4xl rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    No stores available.
                </div>
            )}

            {!loading && stores.length > 0 && (
                <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {stores.map((store, index) => (
                        <article
                            key={store.uuid || store._id}
                            className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            onClick={() => navigate(`/stores/${store.uuid || store._id}`)}
                        >
                            <img
                                className="h-56 w-full object-cover"
                                alt={store.name}
                                src={getStoreImage(store, index)}
                                onError={(e) => {
                                    e.currentTarget.src = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
                                }}
                            />

                            <div className="p-4">
                                <h3 className="line-clamp-1 text-sm font-bold uppercase tracking-wide text-x-600">{store.name}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-x-600/70">{getStoreLocation(store)}</p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};
