import { appConfig } from "@/config/app";
import appLogo from "./icons/app-logo.svg";

export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <img src={appLogo} className="w-6 h-6" />
      <span className="font-semibold text-nowrap">{appConfig.name}</span>
    </div>
  );
}
