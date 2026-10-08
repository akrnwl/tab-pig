"""16x16 도트 돼지 → PNG. 실행: python3 pig.py (stdlib만 사용)"""
import struct, zlib
from pathlib import Path

PALETTE = {
    "P": (247, 168, 190),  # 몸 (원색)
    "S": (232, 132, 159),  # 코·볼터치
    "O": (181, 84, 110),   # 외곽선
    "E": (58, 40, 48),     # 눈·콧구멍·입
}

HEAD_TOP = [
    "................",
    "..OO........OO..",
    ".OPPO......OPPO.",
    ".OPPPOOOOOOPPPO.",
    "..OPPPPPPPPPPO..",
    ".OPPPPPPPPPPPPO.",
]
SNOUT = [
    "OPPPPSSSSSSPPPPO",
    "OPPPPSESSESPPPPO",
]
BOTTOM = [
    ".OPPPPPPPPPPPPO.",
    "..OPPPPPPPPPPO..",
    "...OOOOOOOOOO...",
    "................",
]
EYES_OPEN = [".OPPEPPPPPPEPPO.", "OPPPEPPPPPPEPPPO"]
EYES_HAPPY = [".OPPEPPPPPPEPPO.", "OPPEPEPPPPEPEPPO"]
BLUSH = "OPSSPSSSSSSPSSPO"
PLAIN = "OPPPPSSSSSSPPPPO"

FRAMES = {
    # 평소: 눈 뜨고 입 없음
    "idle": HEAD_TOP + EYES_OPEN + SNOUT + [PLAIN, ".OPPPPPPPPPPPPO.", ".OPPPPPPPPPPPPO."] + BOTTOM,
    # 냠1: 웃는 눈 + 볼터치 + 입 벌림
    "chew1": HEAD_TOP + EYES_HAPPY + SNOUT + [BLUSH, ".OPPPPOEEOPPPPO.", ".OPPPPPOOPPPPPO."] + BOTTOM,
    # 냠2: 웃는 눈 + 볼터치 + 입 다묾
    "chew2": HEAD_TOP + EYES_HAPPY + SNOUT + [BLUSH, ".OPPPPPPPPPPPPO.", ".OPPPPPEEPPPPPO."] + BOTTOM,
}
FRAMES = {k: v[:16] for k, v in FRAMES.items()}


def png(rows, scale):
    w, h = len(rows[0]) * scale, len(rows) * scale
    raw = b""
    for row in rows:
        line = b"".join(bytes(PALETTE[c] + (255,)) if c in PALETTE else b"\0\0\0\0" for c in row for _ in range(scale))
        raw += (b"\0" + line) * scale
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    for name, rows in FRAMES.items():
        assert len(rows) == 16 and all(len(r) == 16 for r in rows), name
    out = Path(__file__).parent / "png"
    out.mkdir(exist_ok=True)
    for name, rows in FRAMES.items():
        for size in (16, 32, 48, 96, 128):
            (out / f"{name}-{size}.png").write_bytes(png(rows, size // 16))
    # 미리보기: 세 프레임 나란히 (x10)
    sheet = [FRAMES["idle"][i] + "." + FRAMES["chew1"][i] + "." + FRAMES["chew2"][i] for i in range(16)]
    (out / "preview.png").write_bytes(png(sheet, 10))
    print("ok:", sorted(p.name for p in out.iterdir()))
