import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  derivationPath: string;
}

interface WalletDetailsProps {
  wallets: Wallet[];
  selectedAccount: number;
  visiblePrivateKeys: boolean[];
  visiblePhrases: boolean[];
  setVisiblePrivateKeys: React.Dispatch<React.SetStateAction<boolean[]>>;
  setVisiblePhrases: React.Dispatch<React.SetStateAction<boolean[]>>;
}

const WalletDetails: React.FC<WalletDetailsProps> = ({
  wallets,
  selectedAccount,
  visiblePrivateKeys,
  visiblePhrases,
  setVisiblePrivateKeys,
  setVisiblePhrases,
}) => {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string): void => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    toast({
      title: "Copied to clipboard",
      description: `${type} has been copied to your clipboard.`,
    });
    setTimeout(() => setCopiedKey(null), 3000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Your Wallet Address</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Your Wallet Details</DialogTitle>
        </DialogHeader>
        {wallets[selectedAccount] && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">
              Account {selectedAccount + 1}:
            </h3>
            <div className="mt-4">
              <p className="text-sm break-all">
                Public Key: {wallets[selectedAccount].publicKey}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      wallets[selectedAccount].publicKey,
                      "Public Key"
                    )
                  }
                >
                  <Copy
                    className={`h-4 w-4 ${
                      copiedKey === "Public Key" ? "text-green-500" : ""
                    }`}
                  />
                </Button>
              </p>
              <div className="mt-4">
                <p className="text-sm">Private Key:</p>
                <p className="text-sm break-all">
                  {visiblePrivateKeys[selectedAccount]
                    ? wallets[selectedAccount].privateKey
                    : "********"}
                </p>
                <div className="flex items-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newVisiblePrivateKeys = [...visiblePrivateKeys];
                      newVisiblePrivateKeys[selectedAccount] =
                        !newVisiblePrivateKeys[selectedAccount];
                      setVisiblePrivateKeys(newVisiblePrivateKeys);
                    }}
                  >
                    {visiblePrivateKeys[selectedAccount] ? "Hide" : "Show"}
                  </Button>
                  {visiblePrivateKeys[selectedAccount] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          wallets[selectedAccount].privateKey,
                          "Private Key"
                        )
                      }
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copiedKey === "Private Key" ? "text-green-500" : ""
                        }`}
                      />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm">Seed Phrase:</p>
                <p className="text-sm break-all">
                  {visiblePhrases[selectedAccount]
                    ? wallets[selectedAccount].mnemonic
                    : "********"}
                </p>
                <div className="flex items-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newVisiblePhrases = [...visiblePhrases];
                      newVisiblePhrases[selectedAccount] =
                        !newVisiblePhrases[selectedAccount];
                      setVisiblePhrases(newVisiblePhrases);
                    }}
                  >
                    {visiblePhrases[selectedAccount] ? "Hide" : "Show"}
                  </Button>
                  {visiblePhrases[selectedAccount] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          wallets[selectedAccount].mnemonic,
                          "Seed Phrase"
                        )
                      }
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copiedKey === "Seed Phrase" ? "text-green-500" : ""
                        }`}
                      />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletDetails;
