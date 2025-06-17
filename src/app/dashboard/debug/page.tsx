"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runFullClerkDebug } from "@/utils/clerk-debug";

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [authBypassData, setAuthBypassData] = useState<any>(null);
  const [clerkDebugData, setClerkDebugData] = useState<any>(null);
  const [edgeFunctionData, setEdgeFunctionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuthBypass = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth-bypass");
      const data = await response.json();
      setAuthBypassData(data);
    } catch (err) {
      setError(`Auth bypass check failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkClerkDebug = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runFullClerkDebug();
      setClerkDebugData(result);
    } catch (err) {
      setError(`Clerk debug check failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEdgeFunction = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/clerk-auth-test`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      setEdgeFunctionData(data);
    } catch (err) {
      setError(`Edge function check failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run all checks on page load
    checkAuthBypass();
    checkClerkDebug();
    checkEdgeFunction();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button
          onClick={checkAuthBypass}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Check Auth Bypass"}
        </Button>

        <Button
          onClick={checkClerkDebug}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600"
        >
          {loading ? "Loading..." : "Run Clerk Debug"}
        </Button>

        <Button
          onClick={checkEdgeFunction}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600"
        >
          {loading ? "Loading..." : "Check Edge Function"}
        </Button>
      </div>

      <Tabs defaultValue="auth-bypass">
        <TabsList className="mb-4">
          <TabsTrigger value="auth-bypass">Auth Bypass</TabsTrigger>
          <TabsTrigger value="clerk-debug">Clerk Debug</TabsTrigger>
          <TabsTrigger value="edge-function">Edge Function</TabsTrigger>
        </TabsList>

        <TabsContent value="auth-bypass">
          <Card>
            <CardHeader>
              <CardTitle>Auth Bypass Check</CardTitle>
              <CardDescription>
                Results from the auth-bypass API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {authBypassData
                  ? JSON.stringify(authBypassData, null, 2)
                  : "No data available"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clerk-debug">
          <Card>
            <CardHeader>
              <CardTitle>Clerk Debug Results</CardTitle>
              <CardDescription>
                Results from the runFullClerkDebug utility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {clerkDebugData
                  ? JSON.stringify(clerkDebugData, null, 2)
                  : "No data available"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge-function">
          <Card>
            <CardHeader>
              <CardTitle>Edge Function Results</CardTitle>
              <CardDescription>
                Results from the clerk-auth-test edge function
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {edgeFunctionData
                  ? JSON.stringify(edgeFunctionData, null, 2)
                  : "No data available"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
