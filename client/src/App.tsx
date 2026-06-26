import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Book from "@/pages/Book";
import DriverPortal from "@/pages/DriverPortal";
import Foundation from "@/pages/Foundation";
import Join from "@/pages/Join";
import Pricing from "@/pages/Pricing";
import CustomerThread from "@/pages/CustomerThread";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/book" component={Book} />
          <Route path="/join" component={Join} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/driver" component={DriverPortal} />
          <Route path="/foundation" component={Foundation} />
          <Route path="/messages/:id" component={CustomerThread} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
