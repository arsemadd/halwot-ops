import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { QueryProvider } from './lib/query'
import { ToastProvider } from './components/ui/Toast'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MembersPage } from './pages/people/MembersPage'
import { MemberDetailPage } from './pages/people/MemberDetailPage'
import { RegisterMemberPage } from './pages/people/RegisterMemberPage'
import { HouseholdsPage } from './pages/people/HouseholdsPage'
import { HouseholdDetailPage } from './pages/people/HouseholdDetailPage'
import { FollowUpsPage } from './pages/people/FollowUpsPage'
import { FollowUpDetailPage } from './pages/people/FollowUpDetailPage'
import { MinistriesPage } from './pages/ministry/MinistriesPage'
import { MinistryDetailPage } from './pages/ministry/MinistryDetailPage'
import { ServingPage } from './pages/ministry/ServingPage'
import { ProgramsPage } from './pages/programs/ProgramsPage'
import { ProgramDetailPage } from './pages/programs/ProgramDetailPage'
import { UsersPage } from './pages/settings/UsersPage'
import { RolesPage } from './pages/settings/RolesPage'
import { ChurchProfilePage } from './pages/settings/ChurchProfilePage'
import { ActivityLogPage } from './pages/settings/ActivityLogPage'
import { RoadmapPage } from './pages/settings/RoadmapPage'
import { AssetsPage } from './pages/operations/AssetsPage'
import { AssetDetailPage } from './pages/operations/AssetDetailPage'
import { CheckoutsPage } from './pages/operations/CheckoutsPage'
import { ExpensesPage } from './pages/operations/ExpensesPage'

const App = () => (
  <QueryProvider>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="people/members" element={<MembersPage />} />
              <Route path="people/members/register" element={<RegisterMemberPage />} />
              <Route path="people/members/:id" element={<MemberDetailPage />} />
              <Route path="people/households" element={<HouseholdsPage />} />
              <Route path="people/households/:id" element={<HouseholdDetailPage />} />
              <Route path="people/follow-ups" element={<FollowUpsPage />} />
              <Route path="people/follow-ups/:id" element={<FollowUpDetailPage />} />
              <Route path="ministry/ministries" element={<MinistriesPage />} />
              <Route path="ministry/ministries/:id" element={<MinistryDetailPage />} />
              <Route path="ministry/serving" element={<ServingPage />} />
              <Route path="programs" element={<ProgramsPage />} />
              <Route path="programs/:id" element={<ProgramDetailPage />} />
              <Route path="operations/assets" element={<AssetsPage />} />
              <Route path="operations/assets/:id" element={<AssetDetailPage />} />
              <Route path="operations/checkouts" element={<CheckoutsPage />} />
              <Route path="operations/expenses" element={<ExpensesPage />} />
              <Route path="settings/users" element={<UsersPage />} />
              <Route path="settings/roles" element={<RolesPage />} />
              <Route path="settings/church-profile" element={<ChurchProfilePage />} />
              <Route path="settings/activity-log" element={<ActivityLogPage />} />
              <Route path="settings/roadmap" element={<RoadmapPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </QueryProvider>
)

export default App
