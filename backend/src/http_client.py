from aiohttp import ClientSession

from async_lru import alru_cache


class HTTPClient:
    def __init__(self, base_url: str):
        self._session = ClientSession(
            base_url=base_url
        )


class CMCHTTPClient(HTTPClient):
    @alru_cache
    async def get_stocks(self):
        async with self._session.get("/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.only=securities&securities.columns=SECID,SHORTNAME,PREVPRICE,ISSUESIZE") as resp:
            result = await resp.json()
            return result["securities"]["data"]

    @alru_cache
    async def get_stock(self, ticker: str):
        async with self._session.get(
            f"/iss/engines/stock/markets/shares/boards/TQBR/securities/{ticker}.json?iss.only=securities&securities.columns=SECID,SHORTNAME,PREVPRICE,ISSUESIZE"
        ) as resp:
            result = await resp.json()
            return result["securities"]["data"][0]

    @alru_cache
    async def get_dividends(self, ticker: str):
        async with self._session.get(
            f"/iss/securities/{ticker}/dividends.json"
        ) as resp:
            result = await resp.json()
            return result["dividends"]["data"][-1][-2]