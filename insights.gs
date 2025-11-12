const AD_FIXED_DIMENSIONS = ["account_name", "account_id", "campaign_name", "campaign_id"]
const AD_METRICS = ["clicks", "cpc", "cpm", "ctr", "impressions", "reach", "spend"]
const AD_ACTIONS = ["action_values", "actions", "cost_per_action_type", "cost_per_unique_action_type"]

async function getAdInsights(accountId, accessToken, level, time_increment, since, until) {
  const config = {
    method: "POST",
    payload: JSON.stringify({
      fields: [...AD_FIXED_DIMENSIONS,
      ...AD_METRICS,
      ...AD_ACTIONS
      ],
      time_increment,
      level,
      time_range: { since, until }
    }),

    url: `${accountId}/insights`
  }

  const requestReport = async () => {

    // Logger.log(`${BASE_URL}/${API_VERSION}/${config.url}`)

    const req = JSON.parse(await UrlFetchApp.fetch(
      url = `${BASE_URL}/${API_VERSION}/${config.url}`,
      options = {
        'method': config.method,
        'contentType': 'application/json',
        'payload': config.payload,
        'headers': {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    ))
    return req.report_run_id
  }

  const pollReport = async (reportId) => {
    const data = await JSON.parse(await UrlFetchApp.fetch(
      url = `${BASE_URL}/${API_VERSION}/${reportId}`,
      options = {
        'method': "GET",
        'contentType': 'application/json',
        'headers': {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    ))

    if (
      data.async_percent_completion === 100 &&
      data.async_status === "Job Completed"
    ) {
      return reportId;
    }

    if (data.async_status === "Job Failed") {
      Logger.log(JSON.stringify(data));
    }

    Utilities.sleep(10000);

    return pollReport(reportId);
  }

  const getInsights = async (reportId) => {
    const data = []
    const _getInsights = async (after = undefined) => {
      const req = await JSON.parse(await UrlFetchApp.fetch(
        url = `${BASE_URL}/${API_VERSION}/${reportId}/insights?after=${after}&limit=500`,
        options = {
          'method': "GET",
          'contentType': 'application/json',
          'headers': {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      ))

      data.push(...req.data)

      if (req.paging.next) {
        return _getInsights(req.paging.cursors.after)
      }
      return
    }

    await _getInsights()
    return data
  }


  return requestReport().then(pollReport).then(getInsights)
}

const parseActionsData = (data) => {
  return data.flatMap(e => {
    return e.flatMap(({ actions, ...r }) => {
      return actions ? actions.map(a => {
        return [
          r.account_id,
          r.account_name,
          r.campaign_id,
          r.campaign_name,
          r.date_start,
          r.date_stop,
          a.action_type,
          a.value,
          r.action_values?.filter(e => e.action_type === a.action_type)[0]?.value,
          r.cost_per_action_type?.filter(e => e.action_type === a.action_type)[0]?.value,
          r.cost_per_unique_action_type?.filter(e => e.action_type === a.action_type)[0]?.value,
        ]
      }) : []
    })
  })
}

const setAdInsights = async (accountIds, accessToken, level, time_increment, since, until) => {
  await Promise.all(
    accountIds.map(accountId => getAdInsights(accountId, accessToken, level, time_increment, since, until))
  )
    .then(
      (data) => {

        const aggregatedResult = data.flatMap(e => {
          return e.map(({ actions, action_values, cost_per_action_type, cost_per_unique_action_type, ...r }) => [
            r.account_name, r.account_id, r.campaign_name, r.campaign_id, r.date_start, r.date_stop, r.clicks, r.cpc, r.cpm, r.ctr, r.impressions, r.reach, r.spend
          ])
        })

        setData("ad_insights", aggregatedResult)

        const actionsResult = parseActionsData(data)
        setData("ad_action_insights", actionsResult)

        return { num_rows: data.length }
      }
    )

}






