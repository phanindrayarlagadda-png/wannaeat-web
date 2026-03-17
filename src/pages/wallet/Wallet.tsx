import { useState, useEffect } from 'react'
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import dayjs from 'dayjs'
import { getWallet, getWalletTransactions } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { WalletTransaction } from '../../types'

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getWallet(), getWalletTransactions()])
      .then(([walletRes, txRes]) => {
        setBalance(walletRes.data?.data?.balance || 0)
        const txData = txRes.data?.data
        setTransactions(Array.isArray(txData) ? txData : (txData?.transactions || []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Wallet" showBack={false} />

      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 mb-6 text-white text-center">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <WalletIcon size={26} />
        </div>
        <p className="text-white/70 text-sm mb-1">Available Balance</p>
        <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
        <p className="text-white/60 text-xs mt-2">WannaEat Credits</p>
      </div>

      {/* Transactions */}
      <div>
        <h3 className="section-title mb-3">Transaction History</h3>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<WalletIcon size={48} strokeWidth={1} />}
            title="No transactions yet"
            description="Your wallet activity will appear here"
          />
        ) : (
          <div className="card divide-y divide-gray-100">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-4 py-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {tx.type === 'credit' ? (
                    <ArrowDownLeft size={20} className="text-green-500" />
                  ) : (
                    <ArrowUpRight size={20} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dayjs(tx.createdAt).format('MMM D, YYYY · h:mm A')}
                  </p>
                </div>
                <p className={`font-bold flex-shrink-0 ${
                  tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
