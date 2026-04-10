import tomllib
from pathlib import Path

_HERE = Path(__file__).resolve().parent

with open(_HERE / "pyproject.toml", "rb") as f:
    data = tomllib.load(f)
    print(data["project"]["version"])
