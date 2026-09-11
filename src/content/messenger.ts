/** Content script entry for Messenger (messenger.com and /messages on Facebook). */
import { messengerSite } from '../sites/messenger';
import { registerChatInfoResponder } from '../sites/messenger/chatInfo';
import { startSiteModule } from '../sites/shared/runtime';

startSiteModule(messengerSite);
// Lets the popup show "Current chat" without the user inspecting the URL.
registerChatInfoResponder();
