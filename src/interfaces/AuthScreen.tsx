import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton.tsx';
import {
  auth,
  signInWithGoogleGameAuth,
  signOutExoUser,
} from '../services/firebase/firebase-client.ts';
import { useExoStore } from '../stores/game.store.ts';

/**
 * [L7] EXO-SHELL Screen 2 — Firebase Auth screen (Game Cloud Saves & Profile only).
 * Strictly decoupled from Google Drive / Docs OAuth scopes.
 */
export function AuthScreen() {
  const setScreen = useExoStore((s) => s.setScreen);
  const previousScreen = useExoStore((s) => s.previousScreen);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  const handleSignIn = async () => {
    setBusy(true);
    setErrorMsg(null);
    const [e] = await signInWithGoogleGameAuth();
    setBusy(false);
    if (e) setErrorMsg(e.message);
  };

  const closeScreen = () =>
    setScreen(previousScreen === 'EXO_GAME_SCREEN' ? 'EXO_GAME_SCREEN' : 'EXO_MAIN_MENU');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-rose-950/35 p-4 dark:bg-[#0d0611]/85">
      <div className="exo-bento-card w-full max-w-md rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-rose-200 pb-3 dark:border-rose-900/60">
          <h1 className="font-display text-lg font-bold text-[#1f1224] dark:text-rose-50">Compte Commandant</h1>
          <button
            type="button"
            onClick={closeScreen}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-200 bg-white/85 px-2.5 text-xs font-medium text-rose-900 hover:border-rose-500 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-rose-950/80 dark:text-rose-100/80">
          Connectez votre compte Google pour sauvegarder vos campagnes et votre chronique historique dans le Cloud. L&apos;accès documentaire optionnel reste isolé dans les Paramètres.
        </p>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-rose-400 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="mt-5">
          {user ? (
            <div className="space-y-3 rounded-xl border border-emerald-500/35 bg-emerald-50 p-4 dark:bg-emerald-950/25">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span>{user.displayName ?? user.email}</span>
              </div>
              <div className="font-mono text-[11px] text-rose-900/65 dark:text-rose-200/70">Identifiant : {user.uid}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeScreen}
                  className="min-h-[40px] flex-1 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-500"
                >
                  Continuer
                </button>
                <button
                  type="button"
                  onClick={() => void signOutExoUser()}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <GoogleSignInButton
                label="Continuer avec Google (Sauvegarde Cloud)"
                onClick={() => void handleSignIn()}
                disabled={busy}
              />
              <button
                type="button"
                onClick={closeScreen}
                className="min-h-[40px] rounded-lg border border-rose-200 bg-white/80 text-xs font-medium text-rose-900/80 hover:border-rose-400 hover:text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
              >
                Jouer hors-ligne sans sauvegarde cloud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
