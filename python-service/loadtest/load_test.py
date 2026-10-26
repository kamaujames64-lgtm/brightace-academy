"""Small staged API concurrency test; run only against a service you own."""
from __future__ import annotations
import argparse
import asyncio
import statistics
import time
import httpx

async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True, help='Base URL, e.g. https://staging.example.com')
    parser.add_argument('--key', required=True, help='Service key (not printed)')
    parser.add_argument('--requests', type=int, default=500)
    parser.add_argument('--concurrency', type=int, default=50)
    args = parser.parse_args()
    if args.requests < 1 or args.concurrency < 1 or args.concurrency > 3000:
        parser.error('requests must be positive; concurrency must be between 1 and 3000')
    sem = asyncio.Semaphore(args.concurrency)
    durations: list[float] = []
    codes: dict[int, int] = {}
    async with httpx.AsyncClient(timeout=15.0, headers={'X-BrightAce-Service-Key': args.key}) as client:
        async def one(i: int) -> None:
            async with sem:
                start = time.perf_counter()
                try:
                    response = await client.post(
                        args.url.rstrip('/') + '/api/v1/jobs',
                        json={'feature': 'text_stats', 'input': {'text': f'load-test request {i} BrightAce'}},
                    )
                    durations.append((time.perf_counter() - start) * 1000)
                    codes[response.status_code] = codes.get(response.status_code, 0) + 1
                except Exception:
                    durations.append((time.perf_counter() - start) * 1000)
                    codes[0] = codes.get(0, 0) + 1
        wall = time.perf_counter()
        await asyncio.gather(*(one(i) for i in range(args.requests)))
        elapsed = time.perf_counter() - wall
    ordered = sorted(durations)
    def percentile(p: float) -> float:
        return ordered[min(len(ordered)-1, int((len(ordered)-1)*p))] if ordered else 0.0
    print(f'requests={args.requests} concurrency={args.concurrency} elapsed_seconds={elapsed:.2f} throughput_rps={args.requests/elapsed:.2f}')
    print(f'status_codes={codes}')
    print(f'latency_ms_avg={statistics.mean(durations):.1f} p50={percentile(.50):.1f} p95={percentile(.95):.1f} p99={percentile(.99):.1f}')
    if codes.get(0, 0) or codes.get(500, 0) or codes.get(502, 0) or codes.get(503, 0):
        raise SystemExit('Failures detected; do not increase load until investigated.')

if __name__ == '__main__':
    asyncio.run(main())
