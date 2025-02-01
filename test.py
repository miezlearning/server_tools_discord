import subprocess

def find_subdomains(domain):
    output = subprocess.check_output(["./subfinder", "-d", domain], text=True)
    subdomains = output.strip().split('\n')
    return subdomains

# Example usage
domain = "smkn7-smr.sch.id/"
subdomains = find_subdomains(domain)
print("Subdomains found:")
for subdomain in subdomains:
    print(subdomain)