import { trpc, getQueryClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Client } from "./client";
import { Suspense } from "react";

export default async function  Home() {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(trpc.hello.queryOptions({text:"Hello"}))
  return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <Suspense fallback={<>OTW BROOOOO.....</>}>
    <Client />
    </Suspense>
  </HydrationBoundary>

  );
}