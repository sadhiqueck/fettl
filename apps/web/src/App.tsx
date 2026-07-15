import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeProvider";
import { router } from "./routes/router";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <Toaster richColors position="top-center" />
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
