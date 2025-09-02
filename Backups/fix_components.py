#!/usr/bin/env python3

import re

# Read the file
with open('explore.html', 'r') as f:
    content = f.read()

# Remove all style="display: none;" from components
content = re.sub(r' style="display: none;"', '', content)

# Write back
with open('explore.html', 'w') as f:
    f.write(content)

print("Removed display:none styles from components") 