/** Content script entry for facebook.com. */
import { facebookSite } from "../sites/facebook";
import { startSiteModule } from "../sites/shared/runtime";

startSiteModule(facebookSite);
