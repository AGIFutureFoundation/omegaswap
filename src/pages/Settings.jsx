import { useState } from "react";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useWalletData } from "@/hooks/useWalletData";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { me } = useWalletData();
  const [busy, setBusy] = useState(false);

  const deleteAccount = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      base44.auth.logout("/");
    } catch (err) {
      setBusy(false);
      toast.error(err?.response?.data?.error || "Could not delete your account");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      <h1 className="hidden font-heading text-3xl font-bold md:block">Settings</h1>
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="select-text font-medium">{me.data?.email}</div>
        <Button variant="outline" className="mt-4" onClick={() => base44.auth.logout()}><LogOut /> Log out</Button>
      </div>
      <div className="space-y-3 rounded-3xl border border-destructive/40 bg-card p-6">
        <div className="font-heading text-lg font-semibold">Delete account</div>
        <p className="text-sm text-muted-foreground">Permanently delete your account and everything in it.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive"><Trash2 /> Delete account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes your gift card balances, trade history, linked apps, agent team and run history, and your login. Cash balance and deposits cannot be recovered. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} Delete forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}