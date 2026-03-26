export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure Nest preferences</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">AI Advisor</h2>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Nest uses a local <strong>Ollama</strong> instance for AI design advice.
            No data leaves your machine.
          </p>
          <div className="text-sm space-y-1">
            <p><strong>Base URL:</strong> <code className="text-xs bg-muted px-1 rounded">OLLAMA_BASE_URL</code> in <code className="text-xs bg-muted px-1 rounded">.env.local</code></p>
            <p><strong>Model:</strong> <code className="text-xs bg-muted px-1 rounded">OLLAMA_CHAT_MODEL</code> — default: <code className="text-xs bg-muted px-1 rounded">qwen2.5:7b</code></p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Price Monitoring</h2>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Nest checks wishlist item prices automatically every 6 hours via a cron job
            set up by <code className="text-xs bg-muted px-1 rounded">start.sh</code>.
          </p>
          <p className="text-sm text-muted-foreground">
            You can also trigger a manual check from the Wishlist tab.
            Supported retailers: IKEA, Wayfair, West Elm, CB2, Crate & Barrel,
            Pottery Barn, Amazon, Target, Home Depot, Article, World Market.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Data Storage</h2>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            All data is stored locally in <code className="text-xs bg-muted px-1 rounded">nest.db</code> (SQLite).
            Images are stored in <code className="text-xs bg-muted px-1 rounded">uploads/</code>.
            No cloud services are used.
          </p>
        </div>
      </section>
    </div>
  );
}
