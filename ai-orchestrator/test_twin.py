from engines.digital_identity_twin import DigitalIdentityTwin

twin = DigitalIdentityTwin()

print("\nJOHN:\n")
print(twin.predict("john_priv"))

print("\nADMIN:\n")
print(twin.predict("ameya_admin"))