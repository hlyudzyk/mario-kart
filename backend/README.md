# Backend Setup

## Prerequisites

Make sure you have Python 3 installed:
```bash
python3 --version
```

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
```

2. Activate the virtual environment:
```bash
# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt)
venv\Scripts\activate.bat
```

You should see `(venv)` in your terminal prompt when active.

## Adding Packages

1. Make sure the virtual environment is active (see above)

2. Install a package:
```bash
pip install <package-name>
```

3. Save it to `requirements.txt`:
```bash
pip freeze > requirements.txt
```

## Installing Existing Packages

To install all packages listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```

## Deactivating

```bash
deactivate
```
