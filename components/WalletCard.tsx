import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CoinsIcon, PlusCircle, RefreshCw, Send, Upload } from "lucide-react";
import { useState, ReactNode, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getUSDConversionRate } from "@/lib/utils";

interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  derivationPath: string;
}

interface WalletCardProps {
  wallets: Wallet[];
  tokens: any[];
  selectedAccount: number;
  bal: number;
  onAccountChange: (value: string) => void;
  onSend: (toAddress: string, amount: number) => void;
  onAddFunds: (isAdding: boolean, amount: number) => void;
  onWithdraw: (isWithdrawing: boolean, amount: number) => void;
  walletBalance: number;
  onCreateNewAccount: () => void;
  onCreateToken: (
    decimals: number,
    name: string,
    symbol: string,
    uri: string,
    description: string,
    mintAmount: number
  ) => void;
  onSwap: (amount: number) => void;
  children: ReactNode;
}

const WalletCard: React.FC<WalletCardProps> = ({
  wallets,
  selectedAccount,
  tokens,
  bal,
  onAccountChange,
  onSend,
  onAddFunds,
  onWithdraw,
  walletBalance,
  onCreateNewAccount,
  onCreateToken,
  onSwap,
  children,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] =
    useState<boolean>(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState<boolean>(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [decimals, setDecimals] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [uri, setUri] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState<boolean>(false);
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  useEffect(() => {
    const fetchUSDConversionRate = async () => {
      const rate = await getUSDConversionRate(parseFloat(swapAmount));
      setUsdcBalance(rate);
    };
    fetchUSDConversionRate();
  }, [swapAmount]);

  const handleSwap = () => {
    onSwap(parseFloat(swapAmount));
    setIsSwapDialogOpen(false);
    setSwapAmount("");
  };

  const handleAddFunds = () => {
    onAddFunds(true, parseFloat(amount));
    setIsAddDialogOpen(false);
    setAmount("");
  };

  const handleWithdraw = () => {
    onWithdraw(false, parseFloat(amount));
    setIsWithdrawDialogOpen(false);
    setAmount("");
  };

  const handleSend = () => {
    onSend(toAddress, parseFloat(amount));
    setIsSendDialogOpen(false);
    setAmount("");
    setToAddress("");
  };

  const handleCreateToken = () => {
    onCreateToken(
      parseInt(decimals),
      name,
      symbol,
      uri,
      description,
      parseInt(mintAmount)
    );
    setIsTokenDialogOpen(false);
    setDecimals("");
    setMintAmount("");
    setName("");
    setSymbol("");
    setUri("");
    setDescription("");
  };

  return (
    <Card className="w-2/3">
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between">
            Wallet
            <WalletMultiButton />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        <Select
          onValueChange={onAccountChange}
          value={selectedAccount.toString()}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((_, index) => (
              <SelectItem key={index} value={index.toString()}>
                Account {index + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-2xl font-semibold">
          Balance: ${bal.toFixed(2)} ({walletBalance.toFixed(3)} SOL)
        </div>
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold">Your Tokens</h2>
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <div
                key={token.mint}
                className="flex justify-between items-center"
              >
                <span>
                  {token.name
                    ? `${token.name} (${token.symbol})`
                    : "Unknown token"}
                </span>
                <span>
                  {token.symbol
                    ? `${token.amount} ${token.symbol}`
                    : `${token.amount} ${token.mint
                        .toString()
                        .slice(0, 3)}...${token.mint.toString().slice(-2)}`}
                </span>
              </div>
            ))
          ) : (
            <div>No non-native tokens found</div>
          )}
        </div>
        <div className="flex justify-between mt-4">
          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogTrigger asChild>
              <Button className="px-4 w-12 sm:w-36 py-2 rounded-md">
                <span className="hidden sm:inline">Send</span>
                <Send className="sm:ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Funds</DialogTitle>
              </DialogHeader>
              <Input
                type="text"
                placeholder="To Address"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount in SOL"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={handleSend}>Send</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={"outline"}
                className="bg-background w-12 sm:w-36 px-4 py-2 rounded-md"
              >
                <span className="hidden sm:inline">Add Funds</span>
                <PlusCircle className="sm:ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Funds</DialogTitle>
              </DialogHeader>
              <Input
                type="number"
                placeholder="Amount in SOL"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={handleAddFunds}>Add</Button>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isWithdrawDialogOpen}
            onOpenChange={setIsWithdrawDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant={"outline"}
                className="bg-background w-12 sm:w-36 px-4 py-2 rounded-md"
              >
                <span className="hidden sm:inline">Withdraw</span>
                <Upload className="sm:ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
              </DialogHeader>
              <Input
                type="number"
                placeholder="Amount in SOL"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={handleWithdraw}>Withdraw</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={"outline"}
                className="bg-background w-12 sm:w-36 px-4 py-2 rounded-md"
              >
                <span className="hidden sm:inline">Create Token</span>
                <CoinsIcon className="sm:ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create and Mint Token</DialogTitle>
              </DialogHeader>
              <Input
                type="number"
                placeholder="Decimals"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Mint Amount"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
              <Input
                type="text"
                placeholder="URI"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button onClick={handleCreateToken}>Create</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={"outline"}
                className="bg-background w-12 sm:w-36 px-4 py-2 rounded-md"
              >
                <span className="hidden sm:inline">Swap</span>
                <RefreshCw className="sm:ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Swap SOL to USDC</DialogTitle>
              </DialogHeader>
              <Input
                type="number"
                placeholder="Amount of SOL"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
              />
              {parseFloat(swapAmount) >
                parseFloat(walletBalance.toFixed(3)) && (
                <p className="text-red-500">Error: Insufficient balance</p>
              )}
              <div>
                <p>You will receive: {usdcBalance} USDC</p>
              </div>
              <Button onClick={handleSwap}>Swap SOL to USDC</Button>
            </DialogContent>
          </Dialog>
        </div>
        {children}
        <Button onClick={onCreateNewAccount} className="mt-4">
          Create New Account
        </Button>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
