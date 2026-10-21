import HomeScreenHeader from './HomeScreenHeader.js';
import HomeScreenBanner from './HomeScreenBanner.js';
import HomeScreenContent from './HomeScreenContent.js';
import HomeScreenFooter from './HomeScreenFooter.js';

export default function HomeScreenPage() {
    return (
        <div className="HomeScreenPage">
            <HomeScreenHeader />
            <HomeScreenBanner />
            <HomeScreenContent />
            <HomeScreenFooter />
        </div>
    );
}