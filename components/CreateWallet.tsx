"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreateWallet = ({ onCreateWallet, onImportWallet }: any) => {
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(
    Array(12).fill("")
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleMnemonicInputChange = (index: number, value: string) => {
    const newMnemonicWords = [...mnemonicWords];
    newMnemonicWords[index] = value;
    setMnemonicWords(newMnemonicWords);
  };

  return (
    <Card className="w-96 ">
      <CardHeader>
        <CardTitle>Wallet Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <Button variant="outline" onClick={onCreateWallet}>
            Create a Wallet
          </Button>
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">Import an Existing Wallet</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Import Wallet</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Enter your seed phrase by typing each word or pasting the entire
                string.
              </DialogDescription>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="flex flex-col">
                    <label
                      htmlFor={`word-${index + 1}`}
                      className="text-sm font-medium"
                    >
                      {index + 1}
                    </label>
                    <Input
                      id={`word-${index + 1}`}
                      value={mnemonicWords[index]}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes(" ")) {
                          const words = value.split(" ");
                          if (words.length === 12) {
                            const newMnemonicWords = words.map((word) =>
                              word.trim()
                            );
                            setMnemonicWords(newMnemonicWords);
                          }
                        } else {
                          handleMnemonicInputChange(index, value);
                        }
                      }}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  onImportWallet(mnemonicWords.join(" ").trim());
                  setIsImportDialogOpen(false);
                }}
              >
                Import Wallet
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateWallet;
