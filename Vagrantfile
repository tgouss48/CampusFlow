Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.hostname = "campusflow-dev"

  # DOSSIERS PARTAGÉS
  # Monte le projet dans la VM
  config.vm.synced_folder ".", "/home/vagrant/campusflow"

  # RESSOURCES VM
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "6144"
    vb.cpus = 2
  end

  # PROVISIONING AVEC ANSIBLE
  # On utilise ansible_local car Ansible n'est pas installé sur Windows.
  # Vagrant l'installera automatiquement dans la VM Ubuntu.
  config.vm.provision "ansible_local" do |ansible|
    ansible.playbook = "ansible/playbook.yml"
    ansible.inventory_path = "ansible/inventory.ini"
    ansible.install_mode = "pip"
    ansible.provisioning_path = "/home/vagrant/campusflow"
    ansible.limit = "all"
  end
end
