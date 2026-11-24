import { Toaster } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import OrderControl from "./pages/OrderControl";
import ChatHub from "./pages/ChatHub";
import OrderPerformance from "./pages/OrderPerformance";
import StockRoom from "./pages/StockRoom";
import MappingDashboard from "./pages/MappingDashboard";
import OrderBuckets from "./pages/OrderBuckets";
import DailyChatSummary from "./pages/DailyChatSummary";
import DailyOrderSummary from "./pages/DailyOrderSummary";
import OrderHistory from "./pages/OrderHistory";
import SystemManual from "./pages/SystemManual";
import TelegramDeliveryRoom from "@/lib/TelegramDeliveryRoom";
import AlertRoom from "./pages/AlertRoom";
import BlackboxRoom from "./pages/BlackboxRoom";
import SecretGallery from "./pages/SecretGallery";
import ParcelMapping from "./pages/ParcelMapping";
import CloseJobHistory from "./pages/CloseJobHistory";
import TelegramSentHistory from "./pages/TelegramSentHistory";
import OrderEditor from "./pages/OrderEditor";
import ScriptAtelier from "./pages/ScriptAtelier";
import MobileInbox from "./pages/MobileInbox";
import LineChat from "./pages/LineChat";
import { GlobalThemeRuntime } from "./contexts/GlobalThemeRuntime";
import { useEffect } from "react";

function Shell({ children }: { children: React.ReactNode }) { return <DashboardLayout>{children}</DashboardLayout>; }
function HomeRoute() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    const isPhone = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
    setLocation(isPhone ? "/daily-order-summary" : "/orders");
  }, [setLocation]);
  return null;
}
function Router() {
  return <Switch>
    <Route path="/connect"><Redirect to="/secret-gallery/connect" /></Route>
    <Route path="/secret-gallery/connect"><SecretGallery /></Route>
    <Route path="/secret-gallery/images"><SecretGallery /></Route>
    <Route path="/secret-gallery"><SecretGallery /></Route>
    <Route path="/mobile-inbox"><MobileInbox /></Route>
    <Route path="/orders"><Shell><OrderControl /></Shell></Route>
    <Route path="/order-editor"><Shell><OrderEditor /></Shell></Route>
    <Route path="/script-atelier"><Shell><ScriptAtelier /></Shell></Route>
    <Route path="/parcel-mapping"><Shell><ParcelMapping /></Shell></Route>
    <Route path="/chats"><Shell><ChatHub /></Shell></Route>
    <Route path="/line-chat"><Shell><LineChat /></Shell></Route>
    <Route path="/vagabond"><Shell><CloseJobHistory /></Shell></Route>
    <Route path="/close-job-history"><Shell><CloseJobHistory /></Shell></Route>
    <Route path="/telegram-delivery"><Shell><TelegramDeliveryRoom /></Shell></Route>
    <Route path="/andromeda"><Shell><TelegramDeliveryRoom /></Shell></Route>
    <Route path="/telegram-sent-history"><Shell><TelegramSentHistory /></Shell></Route>
    <Route path="/alert-room"><Shell><AlertRoom /></Shell></Route>
    <Route path="/blackbox"><Shell><BlackboxRoom /></Shell></Route>
    <Route path="/order-performance"><Shell><OrderPerformance /></Shell></Route>
    <Route path="/stock-room"><Shell><StockRoom /></Shell></Route>
    <Route path="/system-manual"><Shell><SystemManual /></Shell></Route>
    <Route path="/mapping-dashboard"><Shell><MappingDashboard /></Shell></Route>
    <Route path="/order-buckets"><Shell><OrderBuckets /></Shell></Route>
    <Route path="/daily-chat-summary"><Shell><DailyChatSummary /></Shell></Route>
    <Route path="/daily-order-summary"><Shell><DailyOrderSummary /></Shell></Route>
    <Route path="/order-history"><Shell><OrderHistory /></Shell></Route>
    <Route path="/"><HomeRoute /></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><GlobalThemeRuntime><TooltipProvider><Toaster /><Router /></TooltipProvider></GlobalThemeRuntime></ThemeProvider></ErrorBoundary>; }
