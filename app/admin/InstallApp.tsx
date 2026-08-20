"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const listener = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);
  async function install() {
    if (!prompt) {
      setMessage(
        "No iPhone, use Compartilhar → Adicionar à Tela de Início. No Android, abra o menu do navegador.",
      );
      return;
    }
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }
  return (
    <div className="install-app">
      <button onClick={install}>Instalar painel no celular</button>
      {message && <small>{message}</small>}
    </div>
  );
}
