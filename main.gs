async function main() {
  const config = getConfig()

  const accounts = await setAdAccounts(config.businessID, config.accessToken)
  await setAdInsights(
    accountIds = accounts.map(({ id }) => id),
    accessToken = config.accessToken,
    level = "campaign",
    time_increment = 7,
    since = getFirstDayOfWeek(config.latestDate),
    until = getLastDayOfWeek(new Date())
  ).then(
    (r) => {
      Logger.log(r)
      configSheet.getRange("B8").setValue(new Date().toISOString().split("T")[0])
    }
  )
}