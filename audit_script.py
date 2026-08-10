import os
import re

schema_file = r'd:\YOUTUBE\website emb\database\Live_schema_dump.sql'
code_dirs = [r'd:\YOUTUBE\website emb\app', r'd:\YOUTUBE\website emb\src', r'd:\YOUTUBE\website emb\supabase']

# 1. Parse Schema
with open(schema_file, 'r', encoding='utf-8') as f:
    schema_content = f.read()

tables = {}
current_table = None
for line in schema_content.split('\n'):
    line = line.strip()
    table_match = re.match(r'CREATE TABLE (public\.\w+) \(', line)
    if table_match:
        current_table = table_match.group(1).replace('public.', '')
        tables[current_table] = []
    elif current_table and line.startswith(');'):
        current_table = None
    elif current_table and not line.startswith('--') and not line.startswith(')'):
        # Extract column name
        col_match = re.match(r'^([a-zA-Z_0-9]+)\s+', line)
        if col_match:
            tables[current_table].append(col_match.group(1))

print(f'Found {len(tables)} public tables')

# 2. Parse Codebase
code_files = []
for d in code_dirs:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.json', '.sql')):
                code_files.append(os.path.join(root, file))

code_content = ''
for cf in code_files:
    try:
        with open(cf, 'r', encoding='utf-8') as f:
            content = f.read()
            code_content += f'\n--- {cf} ---\n' + content
    except Exception as e:
        pass

# 3. Analyze usage
print('\n--- TABLE USAGE ---')
for table in tables:
    count = len(re.findall(rf'[\'\"`]({table})[\'\"`]', code_content, re.IGNORECASE))
    print(f'Table {table}: {count} occurrences in codebase')
    # Count column usages for this table
    for col in tables[table]:
        col_count = len(re.findall(rf'[\'\"`\.]{col}[\'\"`,:\s\]\)]', code_content, re.IGNORECASE))
        if col_count == 0:
            print(f'  [WARNING] Column "{col}" of table "{table}" has 0 occurrences in codebase!')

print('\n--- SUSPICIOUS KEYWORDS ---')
keywords = ['mock', 'fake', 'dummy', 'lorem']
for kw in keywords:
    matches = re.finditer(rf'(?i).{{0,30}}{kw}.{{0,30}}', code_content)
    count = 0
    for m in matches:
        print(f'[{kw}] {m.group(0).strip()}')
        count += 1
        if count >= 15:
            print('...')
            break

print('\n--- Mismatches (Used in code but not in schema) ---')
# Check for common supabase queries
supabase_queries = re.finditer(r'\.from\([\'\"`]([a-zA-Z_0-9]+)[\'\"`]\)', code_content)
used_tables = set()
for q in supabase_queries:
    used_tables.add(q.group(1))

for ut in used_tables:
    if ut not in tables:
        print(f'[ERROR] Table "{ut}" is queried in codebase but not found in schema!')

