/** Content script entry for instagram.com. */
import { instagramSite } from "../sites/instagram";
import { startSiteModule } from "../sites/shared/runtime";

startSiteModule(instagramSite);
