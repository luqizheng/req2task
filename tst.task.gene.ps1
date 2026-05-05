$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$session.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0"
$session.Cookies.Add((New-Object System.Net.Cookie("auth-token", "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoxLCJ2ZXIiOjF9.Pv-16BLdvEno-GFTtnz7OyB_9qHsk-J2pTJdCPkLs6I0G8OMmxHYJg.pE2jxeLRHtqnMiov.hxDEOBSP0MYUdlDN-lD3VJG0mysLQaLA_Wv2kMqno4AhDCEvKvWEsVyBWIMpacveOY84K437pPU1tO_JMCZ7tgdnBlCdWoXvbjuywy3UGdkc2BGsuVQ02SFklH-Pn8Nsqz7GlWrAfNg22Ym7KEbkToMS3wCoC9pPVCbdoHzxT4tcDTVibjh1YZqBcd3318jXKJXdCNY__idnvv6PQAph7TcTpVOhHRPSqJscUQ._bNwKEZFBxdbB9hagwrXfA", "/", "localhost")))
$session.Cookies.Add((New-Object System.Net.Cookie("sidebar_state", "true", "/", "localhost")))
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5173/api/llm/generation/tasks/aaa6c248-fcf9-4679-a2c6-8b5fb5ac1e84?projectId=076943cb-f63c-4a17-9af1-b4e35ce6483f" `
-Method "POST" `
-WebSession $session `
-Headers @{
"Accept"="application/json, text/plain, */*"
  "Accept-Encoding"="gzip, deflate, br, zstd"
  "Accept-Language"="zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
  "Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDU3MzgxOC00YTE0LTRiOWUtYjRiMC1kMWZiOGQzM2M3MDAiLCJ1c2VybmFtZSI6ImxlbyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3Nzc0MjA5NSwiZXhwIjoxNzc4MzQ2ODk1fQ.nNh2SfP4Uamm1Lb9lGASsR-pXTSoYA9XosFjYLK1UNg"
  "Cache-Control"="no-cache"
  "Origin"="http://localhost:5173"
  "Pragma"="no-cache"
  "Referer"="http://localhost:5173/projects/076943cb-f63c-4a17-9af1-b4e35ce6483f/requirements/aaa6c248-fcf9-4679-a2c6-8b5fb5ac1e84"
  "Sec-Fetch-Dest"="empty"
  "Sec-Fetch-Mode"="cors"
  "Sec-Fetch-Site"="same-origin"
  "sec-ch-ua"="`"Microsoft Edge`";v=`"147`", `"Not.A/Brand`";v=`"8`", `"Chromium`";v=`"147`""
  "sec-ch-ua-mobile"="?0"
  "sec-ch-ua-platform"="`"Windows`""
} `
-ContentType "application/json" `
-Body ([System.Text.Encoding]::UTF8.GetBytes("{`"featurePoints`":`"$([char]21435)`"}"));
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$session.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0"
$session.Cookies.Add((New-Object System.Net.Cookie("auth-token", "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoxLCJ2ZXIiOjF9.Pv-16BLdvEno-GFTtnz7OyB_9qHsk-J2pTJdCPkLs6I0G8OMmxHYJg.pE2jxeLRHtqnMiov.hxDEOBSP0MYUdlDN-lD3VJG0mysLQaLA_Wv2kMqno4AhDCEvKvWEsVyBWIMpacveOY84K437pPU1tO_JMCZ7tgdnBlCdWoXvbjuywy3UGdkc2BGsuVQ02SFklH-Pn8Nsqz7GlWrAfNg22Ym7KEbkToMS3wCoC9pPVCbdoHzxT4tcDTVibjh1YZqBcd3318jXKJXdCNY__idnvv6PQAph7TcTpVOhHRPSqJscUQ._bNwKEZFBxdbB9hagwrXfA", "/", "localhost")))
$session.Cookies.Add((New-Object System.Net.Cookie("sidebar_state", "true", "/", "localhost")))
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5173/api/requirements/aaa6c248-fcf9-4679-a2c6-8b5fb5ac1e84" `
-WebSession $session `
-Headers @{
"Accept"="application/json, text/plain, */*"
  "Accept-Encoding"="gzip, deflate, br, zstd"
  "Accept-Language"="zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
  "Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDU3MzgxOC00YTE0LTRiOWUtYjRiMC1kMWZiOGQzM2M3MDAiLCJ1c2VybmFtZSI6ImxlbyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3Nzc0MjA5NSwiZXhwIjoxNzc4MzQ2ODk1fQ.nNh2SfP4Uamm1Lb9lGASsR-pXTSoYA9XosFjYLK1UNg"
  "Cache-Control"="no-cache"
  "Pragma"="no-cache"
  "Referer"="http://localhost:5173/projects/076943cb-f63c-4a17-9af1-b4e35ce6483f/requirements/aaa6c248-fcf9-4679-a2c6-8b5fb5ac1e84"
  "Sec-Fetch-Dest"="empty"
  "Sec-Fetch-Mode"="cors"
  "Sec-Fetch-Site"="same-origin"
  "sec-ch-ua"="`"Microsoft Edge`";v=`"147`", `"Not.A/Brand`";v=`"8`", `"Chromium`";v=`"147`""
  "sec-ch-ua-mobile"="?0"
  "sec-ch-ua-platform"="`"Windows`""
};
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$session.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0"
$session.Cookies.Add((New-Object System.Net.Cookie("auth-token", "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoxLCJ2ZXIiOjF9.Pv-16BLdvEno-GFTtnz7OyB_9qHsk-J2pTJdCPkLs6I0G8OMmxHYJg.pE2jxeLRHtqnMiov.hxDEOBSP0MYUdlDN-lD3VJG0mysLQaLA_Wv2kMqno4AhDCEvKvWEsVyBWIMpacveOY84K437pPU1tO_JMCZ7tgdnBlCdWoXvbjuywy3UGdkc2BGsuVQ02SFklH-Pn8Nsqz7GlWrAfNg22Ym7KEbkToMS3wCoC9pPVCbdoHzxT4tcDTVibjh1YZqBcd3318jXKJXdCNY__idnvv6PQAph7TcTpVOhHRPSqJscUQ._bNwKEZFBxdbB9hagwrXfA", "/", "localhost")))
$session.Cookies.Add((New-Object System.Net.Cookie("sidebar_state", "true", "/", "localhost")))
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5173/api/requirements/aaa6c248-fcf9-4679-a2c6-8b5fb5ac1e84/allowed-transitions" `
-WebSession $session `
-Headers @{
"Accept"="application/json, text/plain, */*"
  "Accept-Encoding"="gzip, deflate, br, zstd"
  "Accept-Language"="zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
  "Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDU3MzgxOC00YTE0LTRiOWUtYjRiMC1kMWZiOGQzM2M3MDAiLCJ1c2VybmFtZSI6ImxlbyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3Nzc0MjA5NSwiZXhwIjoxNzc4MzQ2ODk1fQ.nNh2SfP4Uamm1Lb9lGASsR-pXTSoYA9XosFjYLK1UNg"
  "Cache-Control"="no-cache"
  "Pragma"="no-cache"
  "Referer"="http://localhost:5173/projects/076943cb-f63c-4a17-9af1-b4e35ce6483f/requirements/aaa6c248-fcf9-4679-a2c6-8b5fb5ac1e84"
  "Sec-Fetch-Dest"="empty"
  "Sec-Fetch-Mode"="cors"
  "Sec-Fetch-Site"="same-origin"
  "sec-ch-ua"="`"Microsoft Edge`";v=`"147`", `"Not.A/Brand`";v=`"8`", `"Chromium`";v=`"147`""
  "sec-ch-ua-mobile"="?0"
  "sec-ch-ua-platform"="`"Windows`""
};
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$session.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0"
$session.Cookies.Add((New-Object System.Net.Cookie("auth-token", "e