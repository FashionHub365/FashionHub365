import React from 'react';
import { View, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

const BANNERS = [
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
];

export default function BannerCarousel() {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const scrollViewRef = React.useRef<ScrollView>(null);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % BANNERS.length;
            scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
            setActiveIndex(nextIndex);
        }, 4000);
        return () => clearInterval(interval);
    }, [activeIndex]);

    const handleScroll = (event: any) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
            >
                {BANNERS.map((imgUrl, index) => (
                    <View key={index} style={styles.bannerContainer}>
                        <Image source={{ uri: imgUrl }} style={styles.bannerImage} />
                    </View>
                ))}
            </ScrollView>

            {/* Dots Indicator */}
            <View style={styles.dotsContainer}>
                {BANNERS.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            activeIndex === index && styles.activeDot
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 160,
        backgroundColor: '#fff',
        position: 'relative',
    },
    bannerContainer: {
        width: width,
        height: 160,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    bannerImage: {
        width: width - 20,
        height: 140,
        resizeMode: 'cover',
        borderRadius: 12,
    },
    dotsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 3,
    },
    activeDot: {
        width: 14,
        backgroundColor: '#fff',
    }
});
