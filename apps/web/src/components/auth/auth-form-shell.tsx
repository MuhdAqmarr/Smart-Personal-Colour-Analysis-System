import { Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface AuthFormShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared card chrome for all auth screens, with a clear notice when the
 * Supabase environment is not configured (guest analysis still works). */
export function AuthFormShell({ title, description, children, footer }: AuthFormShellProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupabaseConfigured() ? (
          <Alert>
            <Info aria-hidden="true" />
            <AlertTitle>Accounts are not configured</AlertTitle>
            <AlertDescription>
              This deployment has no Supabase credentials, so sign-in is unavailable. You can still
              run a full analysis as a guest.
            </AlertDescription>
          </Alert>
        ) : null}
        {children}
      </CardContent>
      {footer ? <CardFooter className="justify-center text-sm">{footer}</CardFooter> : null}
    </Card>
  );
}
