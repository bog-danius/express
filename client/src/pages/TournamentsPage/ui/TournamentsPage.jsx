import React from 'react'
import TournamentList from '../../../features/tournaments/ui/TournamentList'
import RegisterForm from '../../../features/registration/ui/RegisterForm'
import MatchResults from '../../../features/results/ui/MatchResults'
import DownloadButtons from '../../../features/download/ui/DownloadButtons'

export default function TournamentsPage(){
  return (
    <div>
      <h1>Платформа для организации турниров</h1>
      <TournamentList />
      <RegisterForm />
      <MatchResults />
      <DownloadButtons />
    </div>
  )
}
