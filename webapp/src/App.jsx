import React from 'react';
import { useAppState } from './state/store.jsx';
import { BootScreen, SetupScreen, AuthScreen, VerifyScreen, PendingScreen } from './components/Screens.jsx';
import { Header, BottomNav, Fab, ModalHost, ToastHost } from './components/Layout.jsx';
import { AccountModal } from './components/AccountModal.jsx';
import { AdminModal } from './components/AdminModal.jsx';
import { DepositForm, ExpenseForm, SupplierForm, LoanForm, ShareholderForm } from './components/Forms.jsx';
import Dashboard from './components/tabs/Dashboard.jsx';
import Deposits from './components/tabs/Deposits.jsx';
import Expenses from './components/tabs/Expenses.jsx';
import Suppliers from './components/tabs/Suppliers.jsx';
import Loans from './components/tabs/Loans.jsx';
import Shareholders from './components/tabs/Shareholders.jsx';
import Report from './components/tabs/Report.jsx';

const TAB_COMPONENTS = {
  dashboard: Dashboard,
  deposits: Deposits,
  expenses: Expenses,
  suppliers: Suppliers,
  loans: Loans,
  shareholders: Shareholders,
  report: Report,
};

const TAB_FORMS = {
  deposits: DepositForm,
  expenses: ExpenseForm,
  suppliers: SupplierForm,
  loans: LoanForm,
  shareholders: ShareholderForm,
};

function AppShell() {
  const { tab, setTab, openModal, closeModal } = useAppState();
  const TabComponent = TAB_COMPONENTS[tab] || Dashboard;

  function handleFab() {
    const formTab = tab === 'dashboard' ? 'deposits' : tab;
    const FormComponent = TAB_FORMS[formTab];
    if (!FormComponent) return;
    openModal(<FormComponent record={null} onClose={closeModal} />);
  }

  return (
    <div id="app" className="fade-in">
      <Header
        onOpenAdmin={() => openModal(<AdminModal onClose={closeModal} />)}
        onOpenReport={() => setTab('report')}
        onOpenAccount={() => openModal(<AccountModal onClose={closeModal} />)}
      />
      <main>
        <TabComponent />
      </main>
      <Fab onClick={handleFab} hidden={tab === 'report'} />
      <BottomNav />
    </div>
  );
}

export default function App() {
  const { screen } = useAppState();
  return (
    <>
      {screen === 'boot' && <BootScreen />}
      {screen === 'setup' && <SetupScreen />}
      {screen === 'auth' && <AuthScreen />}
      {screen === 'verify' && <VerifyScreen />}
      {screen === 'pending' && <PendingScreen />}
      {screen === 'app' && <AppShell />}
      <ModalHost />
      <ToastHost />
      <div id="printArea" />
    </>
  );
}
