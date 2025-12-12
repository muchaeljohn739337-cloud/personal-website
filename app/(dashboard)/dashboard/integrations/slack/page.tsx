'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ExternalLink, Loader2, MessageSquare, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SlackIntegrationPage() {
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check connection status
    checkConnectionStatus();

    // Check for OAuth callback success/error
    const errorParam = searchParams?.get('error');
    const successParam = searchParams?.get('success');

    if (errorParam) {
      setError(getErrorMessage(errorParam));
    } else if (successParam === 'true') {
      setSuccess(true);
      setIsConnected(true);
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/integrations/slack');
    }
  }, [searchParams]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/slack/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected || false);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/slack/oauth');
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Slack OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get OAuth URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Slack');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/integrations/slack/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setIsConnected(false);
        setSuccess(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'access_denied':
        return 'Access denied. Please authorize the Slack app.';
      case 'oauth_failed':
        return 'OAuth authentication failed. Please try again.';
      case 'missing_params':
        return 'Missing required parameters. Please try again.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Slack Integration</h1>
          <p className="text-muted-foreground">
            Connect your Slack workspace to receive notifications and manage your team
            communication.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">
              Successfully connected to Slack!
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Slack Workspace</CardTitle>
                  <CardDescription>
                    Connect your Slack workspace to enable notifications and team communication
                  </CardDescription>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Not Connected</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Receive payment notifications in Slack channels
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Get alerts for system errors and deployments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Monitor user activity and admin actions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Send direct messages to team members
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              {isConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your Slack workspace is connected. You can receive notifications and interact
                    with your team through Slack.
                  </p>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    Disconnect Slack
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click the button below to authorize Advancia PayLedger to access your Slack
                    workspace. You&apos;ll be redirected to Slack to complete the authorization.
                  </p>
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full sm:w-auto"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Connect Slack Workspace
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Setup Instructions</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>
                  Make sure you have admin access to your Slack workspace (
                  <a
                    href="https://advanciapayledger.slack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    advanciapayledger.slack.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  )
                </li>
                <li>Click &quot;Connect Slack Workspace&quot; button above</li>
                <li>Authorize the app in Slack&apos;s OAuth screen</li>
                <li>You&apos;ll be redirected back here once connected</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you need to set up a Slack app from scratch, visit{' '}
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  api.slack.com/apps
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                to create a new app and configure the OAuth redirect URL.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
