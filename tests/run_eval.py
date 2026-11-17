#!/usr/bin/env python3
"""Runner wrapper in tests/ directory pointing to test_eval/run_eval.py"""
import sys
from pathlib import Path

# Add test_eval directory to path
TEST_EVAL_DIR = Path(__file__).resolve().parent.parent / "test_eval"
sys.path.insert(0, str(TEST_EVAL_DIR))

from run_eval import main

if __name__ == "__main__":
    main()

