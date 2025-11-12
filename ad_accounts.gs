const BASE_URL = "https://graph.facebook.com"
const API_VERSION ="v24.0"

async function getAdAccounts (businessID,accessToken ) {
  const edges = ["client_ad_accounts","owned_ad_accounts"]
  const fields = [  "account_id",
                    "account_status",
                    "business_name",
                    "currency",
                    "created_time",
                    "timezone_name",
                    "name",
                  ]
  
  return Promise.all(
    edges.map( async( e ) => {
      return JSON.parse(UrlFetchApp.fetch(
        url =`${BASE_URL}/${API_VERSION}/${businessID}/${e}?limit=500&fields=${fields.join(',')}`,
        options = {
          'method':'GET',
          'contentType': 'application/json',
          'headers': {
            'Authorization': `Bearer ${accessToken}`
          }
        }
        )).data
    })
  ).then(objGroups => {
          return objGroups.flatMap(obj=>obj) })
}

const setAdAccounts = async (businessID, accessToken) => {
  const data = await getAdAccounts(businessID,accessToken)
  const result = [Object.keys(data[0]),...data.map(r => Object.values(r))]
  setData("ad_accounts", result)
  Logger.log("Successfully set ad_accounts")
  return data
}

